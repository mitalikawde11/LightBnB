const { Pool } = require('pg');

// Connecting to the database
const pool = new Pool({
  user: 'labber',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users
/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return pool
    .query(`
      SELECT * FROM users
      WHERE email = $1;
    `, [email])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.error('query error', err.stack);
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool
    .query(`
      SELECT * FROM users
      WHERE id = $1;
    `, [id])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.error('query error', err.stack);
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  return pool
    .query(`
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING *;
    `, [user.name, user.email, user.password])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.error('query error', err.stack);
    })
};

/// Reservations
/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return pool
    .query(`
    SELECT reservations.*, properties.*, ROUND(AVG(rating), 1) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2;
    `, [guest_id, limit])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.error('query error', err.stack);
    });
};

/// Properties
/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  const queryParams = [];
  
  let queryString = `
  SELECT properties.*, ROUND(AVG(property_reviews.rating), 1) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;
  
  if (options.city && options.minimum_price_per_night && options.maximum_price_per_night && options.minimum_rating) {
    queryParams.push(`%${options.city}%`, `${options.minimum_price_per_night}`, `${options.maximum_price_per_night}`, `${options.minimum_rating}`, limit);
    queryString += `
    WHERE city LIKE $1
    AND cost_per_night/100 BETWEEN $2 AND $3
    GROUP BY properties.id
    HAVING avg(property_reviews.rating) >= $4
    ORDER BY cost_per_night
    LIMIT $5;
    `;
  } else if (options.city && options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(`%${options.city}%`, `${options.minimum_price_per_night}`, `${options.maximum_price_per_night}`);
    queryString += `
    WHERE city LIKE $1
    AND cost_per_night/100 BETWEEN $2 AND $3
    `;

  } else if (options.city && options.minimum_rating) {
    queryParams.push(`%${options.city}%`, `${options.minimum_rating}`, limit);
    queryString += `
    WHERE city LIKE $1
    GROUP BY properties.id
    HAVING avg(property_reviews.rating) >= $2
    ORDER BY cost_per_night
    LIMIT $3;
    `;

  } else if (options.city) {
    // only return properties belonging to that city
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;

  } else if (options.owner_id) {
    // only return properties belonging to that owner
    queryParams.push(`${options.owner_id}`);
    queryString += `WHERE owner_id = $${queryParams.length}`;

  } else if (options.minimum_price_per_night && options.maximum_price_per_night) {
    // only return properties within that price range
    queryParams.push(`${options.minimum_price_per_night}`);
    queryParams.push(`${options.maximum_price_per_night}`);
    queryString += `WHERE cost_per_night/100 BETWEEN $${queryParams.length-1} AND $${queryParams.length}`

  } else if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryParams.push(limit);
    queryString += `
    GROUP BY properties.id
    HAVING avg(property_reviews.rating) >= $${queryParams.length-1}
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;
  }
  
  if (!options.minimum_rating) {
    queryParams.push(limit);
    queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;
  }

  return pool.query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.error('query error', err.stack);
  });
  
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  return pool
    .query(`
      INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `, [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night * 100, property.street, property.city, property.province, property.post_code, property.country, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.error('query error', err.stack);
    })
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
