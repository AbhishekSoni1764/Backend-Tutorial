import dotenv from "dotenv"
import { app } from "./app.js"
import connectDB from "./db/index.js";
dotenv.config({
    path: './.env'
})

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 5001, () => {
            console.log(`Server is running on Port : ${process.env.PORT}`);
        })
    })
    .catch((error) => {
        console.log("MONGDB Connection UNSUCCESSFUL!! ", error);

    })