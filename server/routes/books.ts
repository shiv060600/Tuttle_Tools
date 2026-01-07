import { Request, Response, Router } from "express";
import { GetBookParamsDict } from "../types";
import { getConnection } from "../config/db";
import { Book } from "../types";
import { IResult,IRecordSet } from "mssql";
import { ConnectionPool } from "mssql";
const express = require('express');


//route is api/books
const router: Router = express.Router();


router.get('/:isbn',async (req : Request<GetBookParamsDict,{},{}>, res: Response) => {
    if (!req.params.isbn){
        return res.status(300).json({message: "You must submit with isbn"})
    }
    const isbn = req.params.isbn;

    console.log(`getting info for book ISBN: ${req.params.isbn}`);
    try {
        const conn = await getConnection();

        const result : IResult<Book> = await conn.request()
            .input('isbn',isbn)
            .query<Book>('SELECT * FROM IPS.dbo.book_details_table WHERE ISBN = @isbn');

        if(result.recordset.length === 0){
            return res.status(404).json({message: `There is no book with isbn ${isbn}`})
        } else if(result.recordset.length === 1){
            return res.status(200).json({data: result.recordset[0]});
        } else {
            const books: Book[] = result.recordset;
            return res.status(200).json({data: books})
        };
    }catch(error){
        if(error instanceof Error){
            console.error('DB error in book get route: ', error.message)
            return res.status(500).json({
                error: 'Failed to fetch book details',
                message: error.message
            });
        };

        console.error('unexpected error occured');

        return res.status(500).json({
            error: 'unexpected error occured'
        });

    }




});

export default router;



