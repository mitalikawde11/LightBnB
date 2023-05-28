# LightBnB Project
A simple multi-page Airbnb clone that uses a server-side Javascript to display the information from queries to web pages via SQL queries. 

## Project Structure

```
.
├── db
│   ├── json
│   └── database.js
├── public
│   ├── javascript
│   │   ├── components 
│   │   │   ├── header.js
│   │   │   ├── login_form.js
│   │   │   ├── new_property_form.js
│   │   │   ├── property_listing.js
│   │   │   ├── property_listings.js
│   │   │   ├── search_form.js
│   │   │   └── signup_form.js
│   │   ├── libraries
│   │   ├── index.js
│   │   ├── network.js
│   │   └── views_manager.js
│   ├── styles
│   │   ├── main.css
│   │   └── main.css.map
│   └── index.html
├── routes
│   ├── apiRoutes.js
│   └── userRoutes.js
├── styles  
│   ├── _forms.scss
│   ├── _header.scss
│   ├── _property-listings.scss
│   └── main.scss
├── .gitignore
├── package-lock.json
├── package.json
├── README.md
└── server.js
migration
└── 01_schema.sql
seeds
└── 01_seeds.sql
└── 02_seeds.sql


```

* `db` contains all the database interaction code.
  * `json` is a directory that contains a bunch of dummy data in `.json` files.
  * `database.js` is responsible for all queries to the database. It doesn't currently connect to any database, all it does is return data from `.json` files.
* `public` contains all of the HTML, CSS, and client side JavaScript. 
  * `index.html` is the entry point to the application. It's the only html page because this is a single page application.
  * `javascript` contains all of the client side javascript files.
    * `index.js` starts up the application by rendering the listings.
    * `network.js` manages all ajax requests to the server.
    * `views_manager.js` manages which components appear on screen.
    * `components` contains all of the individual html components. They are all created using jQuery.
* `routes` contains the router files which are responsible for any HTTP requests to `/users/something` or `/api/something`. 
* `styles` contains all of the sass files. 
* `server.js` is the entry point to the application. This connects the routes to the database.

* `migrations` contains the SQL file.
  * `01_schema.sql` contains sql queries to create users, properties, reservations & property_reviews tables in the `lightbnb` database.
* `seeds` contains sql files.
  * `01_seeds.sql` contains sql INSERT commands to insert data into all tables.
  * `02_seeds.sql` contains sql INSERT commands to insert so many data into all tables.

## `db` contains all the database interaction code.
  This project uses a `PostgreSQL` (RDBMS).
  ### `database.js`:
   is responsible for all queries to the database. It connects to the `lightbnb` database. This file contains functions to add user, get user, add prperties, get all properties, get all reservations from lightbnb database. 

  #### `getUserWithEmail(email)`: 
    Get a single user from the database given their email. Returns a promise to the user.

  #### `getUserWithId(id)` :
    Get a single user from the database given their id. Returns a promise to the user.

  #### `addUser(user)` :
    Add a new user to the database. Returns a promise to the user.

  #### `getAllReservations(guest_id , limit)` :
    Get all reservations for a single user. guest_id The id of the user. Returns a promise to the reservations.
    `screenshot`: 
    !["Screenshot of my Reservations"](https://github.com/mitalikawde11/LightBnB/blob/master/screenshots/my_reservations.png?raw=true)


  #### `getAllProperties(options, limit)` :
    Get all properties. options An object containing query options to filter properties by city, range of minimum and maxumun price, minimum_rating and owner_id. limit The number of results to return. Returns a promise to the properties.
    !["Screenshot"]() :
    !["Screenshot of search (filter property)"](https://github.com/mitalikawde11/LightBnB/blob/master/screenshots/property_filter_options.png?raw=true)
    

  #### `addProperty(property)` :
    Add a property to the database. property An object containing all of the property details. Returns a promise to the property.
    Screenshot: 
    !["Screenshot of add property"](https://github.com/mitalikawde11/LightBnB/blob/master/screenshots/add_property.png?raw=true)

   