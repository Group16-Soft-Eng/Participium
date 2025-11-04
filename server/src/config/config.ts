import path = require("path");


export const CONFIG= {
    PORT : 5000,
    DB_TYPE : "sqlite",
    DB_ENTITIES : [path.join(__dirname, "/../models/dao/*.{ts,js}")],
    DB_NAME : "database.db", 
    // here set the ROUTES
    //PHOTO_ROUTE : "/photo",
}