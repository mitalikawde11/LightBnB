const { Pool } = require('pg');

const pool = new Pool({
  user: 'labber',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

// pool.query(`SELECT title FROM properties LIMIT 10;`).then(response => {console.log(response)})


const properties = require("./json/properties.json");
const users = require("./json/users.json");

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
      // console.log("Get user with email: ", result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      // console.log(err.message);
      console.error('query error', err.stack);
    });
  
  // Previous code: 
  // let resolvedUser = null;
  // for (const userId in users) {
  //   const user = users[userId];
  //   // if (user?.email.toLowerCase() === email?.toLowerCase()) {
  //   if (user && user.email.toLowerCase() === email.toLowerCase()) { 
  //     resolvedUser = user;
  //   }
  // }
  // return Promise.resolve(resolvedUser);
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
      // console.log("Get user with id: ", result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      // console.log(err.message);
      console.error('query error', err.stack);
    });

  // Previous code:
  // return Promise.resolve(users[id]);
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
      // console.log("Result: ", result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      // console.log(err.message);
      console.error('query error', err.stack);
    })
  
  // Prevoius code: 
  // const userId = Object.keys(users).length + 1;
  // user.id = userId;
  // users[userId] = user;
  // return Promise.resolve(user);
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
      // console.log("All reservations: ", result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
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
  // query(`SELECT * FROM properties LIMIT $1`, [limit])
  // 1
  const queryParams = [];
  // 2
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

  console.log(queryString, queryParams);
    
  return pool.query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
  });
  
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
