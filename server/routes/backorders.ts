import { getConnection } from "../config/db";
import { Request, Response, Router } from "express";
import { Book, BookBackorder } from "../types";
import { IResult } from "mssql";

const express = require('express');

const router: Router = express.Router();

interface BackorderError {
    error: string;
    message?: string;
}

// /api/backorders/:isbn
router.get('/:isbn', async (req: Request<{isbn: string}>, res: Response<BookBackorder | BackorderError>) => {
    const conn = await getConnection();
    const isbn = req.params.isbn;

    try {

        const result: IResult<BookBackorder> = await conn.request()
            .input('isbn', isbn)
            .query('SELECT ISBN, QTY as QTY_BACKORDERED FROM TUTLIV.dbo.BACKORDER_REPORT WHERE ISBN = @isbn');

        if (result.recordset.length === 0) {
            const book: BookBackorder = {
                ISBN: isbn,
                QTY_BACKORDERED: 0
            }
            return res.status(200).json(book);
        } else {
            const backorderDetails: BookBackorder = result.recordset[0];
            return res.status(200).json(backorderDetails);
        }

    } catch (error) {
        if (error instanceof Error) {
            console.error('DB error in backorders get route: ', error.message);
            return res.status(500).json({
                error: 'Failed to fetch backorder details',
                message: error.message
            });
    }};
    

});

export default router;