import { Request,Response } from "express";
import { getConnection } from "../config/db";
import { Connection } from "odbc";
import { LogDeleteResonse } from "../types";

const express = require('express');
const router = express.Router();


//logs router prefix : /logging



//get all logs
router.get('/', async(req: Request<{},{},{}>, res: Response) => {
    
    let conn : Connection | undefined | null;
    try{
         conn = await getConnection();
         const query = (
            `
            SELECT * FROM IPS.dbo.TuttleMappingLogger
            `
         );

         const result = await conn.query(query);

         res.json(result);
    }catch(err){
        console.error(`error fetching logs from db ${err}`);
        throw new Error(`error fetching logs from db ${err}`);
    }finally{
        if(conn){
            conn.close();
        }
    }

});

//delete logs for the ammount of days
router.delete('/:days', async(
        req: Request<{days: string},{},{}>,
        res: Response<LogDeleteResonse>
    ) => {


})