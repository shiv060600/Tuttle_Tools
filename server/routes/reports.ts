const express = require('express');
import { getConnection } from "../config/db";
import { Request, Response, Router } from "express";
import { IResult } from "mssql";
import { INV_ADJ_CC_IPS, INV_ADJ_OH_ING, INV_RR, ADJ_S_R } from "../types";
import ExcelJS from 'exceljs';

const router: Router = express.Router();

interface ReportError {
    error: string;
    message?: string;
}
interface AvailableReportsResponse {
    INV_ADJ_CC_ING: boolean;
    INV_ADJ_CC_IPS: boolean;
    INV_ADJ_OH_IPS: boolean;
    INV_ADJ_OH_ING: boolean;
    INV_RR: boolean;
    INV_TI: boolean;
    ADJ_S_R: boolean;
}
//base is /api/reports

router.get("/available", async (req:Request, res: Response<AvailableReportsResponse | ReportError>) =>  {
    let conn;
    try {
        const response: AvailableReportsResponse = {
            INV_ADJ_CC_ING: false,
            INV_ADJ_CC_IPS: false,
            INV_ADJ_OH_IPS: false,
            INV_ADJ_OH_ING: false,
            INV_RR: false,
            INV_TI: false,
            ADJ_S_R: false
        };

        conn = await getConnection();
        const result: IResult<string[]> = await conn.request()
            .query(
                `
                SELECT TRIM(CAST(ReportName as VARCHAR(50))) as ReportName FROM IPS.dbo.REPORTS WHERE DATA = 'X'
                `)
        
        const availableReportNames = result.recordset;

        availableReportNames.forEach((row: any) => {
            const reportName = row.ReportName;
            if (reportName && response.hasOwnProperty(reportName)) {
                response[reportName as keyof AvailableReportsResponse] = true;
            }
        });

        return res.status(200).json(response);

    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching available reports: ', error.message);
            return res.status(500).json({
                error: 'Failed to fetch available reports',
                message: error.message
            });
        }
    } finally{
        if (conn){
            conn.close();
        }
    }
    
    const availableReports: AvailableReportsResponse = {
        INV_ADJ_CC_ING: false,
        INV_ADJ_CC_IPS: false,
        INV_ADJ_OH_IPS: false,
        INV_ADJ_OH_ING: false,
        INV_RR: false,
        INV_TI: false,
        ADJ_S_R: false
    };

    return res.status(200).json(availableReports);
});


router.get("/:reportType", async(req: Request<{reportType: string}>, res: Response<INV_ADJ_CC_IPS[] | INV_ADJ_OH_ING[] | INV_RR[] | ADJ_S_R[] | ReportError | null>)=> {
    let conn;
    
    const reportType = req.params.reportType;

    switch(reportType) {
        case "INV_ADJ_CC_IPS":
            try {
                conn = await getConnection();
                const result: IResult<INV_ADJ_CC_IPS> = await conn.request()
                    .query(`
                        SELECT 
                            CAST(IPS.EAN AS Char(24)) AS EAN,
                            I.[DESC] as TITLE,
                            IPS.WHS,
                            IPS.Qty,
                            IPS.Acttype
                        From IPS.dbo.IPS_INV as IPS LEFT JOIN TUTLIV.dbo.ICITEM I ON TRIM(I.ITEMNO) = TRIM(CAST(IPS.EAN AS Char(24)))
                        WHERE WHS = 'IPS' and Acttype = 'CC'`
                    );
                return res.status(200).json(result.recordset);
            } catch (error) {
                if (error instanceof Error) {
                    console.error('DB error in reports get route: ', error.message);
                    return res.status(500).json({
                        error: 'Failed to fetch report details',
                        message: error.message
                    });
                }
            } finally {
                if (conn){
                    conn.close();
                };
            }
            break;
        case "INV_ADJ_OH_ING":
            try {
                conn = await getConnection();
                const result: IResult<INV_ADJ_OH_ING> = await conn.request()
                    .query(`
                        SELECT
                            IPS.WHS,
                            CAST(IPS.EAN AS Char(24)) AS EAN,
                            I.[DESC] as TITLE,
                            IPS.Qty,
                            IPS.Acttype
                        From IPS.dbo.IPS_INV as IPS LEFT JOIN TUTLIV.dbo.ICITEM I ON TRIM(I.ITEMNO) = TRIM(CAST(IPS.EAN AS Char(24)))
                        WHERE IPS.WHS = 'ING' and IPS.Acttype IN('OH','KA','KW')
                            `);
                return res.status(200).json(result.recordset);
            } catch (error) {
                if (error instanceof Error) {
                    console.error('DB error in reports get route: ', error.message);
                }
            } finally {
                if (conn){
                    conn.close();
                }
            }
            break;
        case "INV_TI":
            try {
                conn = await getConnection();
                const result: IResult<INV_ADJ_OH_ING> = await conn.request()
                    .query(
                        `
                        SELECT
                            IPS.WHS,
                            CAST(IPS.EAN AS Char(24)) AS EAN,
                            I.[DESC] as TITLE,
                            IPS.Qty,
                            IPS.Acttype
                        From IPS.dbo.IPS_INV as IPS LEFT JOIN TUTLIV.dbo.ICITEM I ON TRIM(I.ITEMNO) = TRIM(CAST(IPS.EAN AS Char(24)))
                        WHERE IPS.Acctype = 'TI'
                        `)
                return res.status(200).json(result.recordset);
            } catch (error) {
                if (error instanceof Error) {
                    console.error('DB error in reports get route: ', error.message);
                }
            } finally {
                if (conn){
                    conn.close();
                }
            }
            break;

        case "INV_ADJ_OH_IPS":
            try {
                conn = await getConnection();
                const result: IResult<INV_ADJ_OH_ING> = await conn.request()
                    .query(
                        `
                        SELECT
                            IPS.WHS,
                            CAST(IPS.EAN AS Char(24)) AS EAN,
                            I.[DESC] as TITLE,
                            IPS.Qty,
                            IPS.Acttype AS REASON_CODE
                        From IPS.dbo.IPS_INV as IPS LEFT JOIN TUTLIV.dbo.ICITEM I ON TRIM(I.ITEMNO) = TRIM(CAST(IPS.EAN AS Char(24)))
                        WHERE IPS.WHS = 'IPS' and IPS.Acttype IN('OH','KA','KW')

                        `)
                return res.status(200).json(result.recordset);
            }catch (error) {
                if (error instanceof Error) {
                    console.error('DB error in reports get route: ', error.message);
                    return res.status(500).json({
                        error: 'Failed to fetch report details',
                        message: error.message
                    });
                }
            } finally {
                if (conn){
                    conn.close();
                }
            }
            break;
        case "INV_ADJ_CC_ING":
            try {
                conn = await getConnection();
                const result: IResult<INV_ADJ_OH_ING> = await conn.request()
                    .query(
                        `
                        SELECT
                            IPS.WHS,
                            CAST(IPS.EAN AS Char(24)) AS EAN,
                            I.[DESC] as TITLE,
                            IPS.Qty,
                            IPS.Acttype
                        From IPS.dbo.IPS_INV as IPS LEFT JOIN TUTLIV.dbo.ICITEM I ON TRIM(I.ITEMNO) = TRIM(CAST(IPS.EAN AS Char(24)))
                        WHERE IPS.WHS = 'ING' and IPS.Acttype = 'CC'
                        `)
                return res.status(200).json(result.recordset);
            } catch (error) {
                if (error instanceof Error) {
                    console.error('DB error in reports get route: ', error.message);
                }
            } finally {
                if (conn){
                    conn.close();
                }
            }
            break;
        case "INV_RR":
            try {
                conn = await getConnection();
                const result: IResult<INV_RR> = await conn.request()
                    .query(
                        `
                        SELECT
                            IPS.WHS,
                            CAST(IPS.EAN AS Char(24)) AS ISBN,
                            I.[DESC] as TITLE,
                            IPS.Qty,
                            IPS.Acttype AS REASON_CODE
                        From IPS.dbo.IPS_INV as IPS LEFT JOIN TUTLIV.dbo.ICITEM I ON TRIM(I.ITEMNO) = TRIM(CAST(IPS.EAN AS Char(24)))
                        WHERE IPS.Acttype = 'RR'
                        `)
                return res.status(200).json(result.recordset);
            } catch (error) {
                if (error instanceof Error) {
                    console.error('DB error in reports get route: ', error.message);
                    return res.status(500).json({
                        error: 'Failed to fetch report details',
                        message: error.message
                    });
                }
            } finally {
                if (conn){
                    conn.close();
                }
            }
            break;
        case "ADJ_S_R":
            try {
                conn = await getConnection();
                const result: IResult<ADJ_S_R> = await conn.request()
                    .query(
                        `
                        SELECT
                            CAST(ISBN AS Char(24)) AS ISBN,
                            ttl.TITLE,
                            Ordnum,
                            Otype,
                            Ponumber,
                            Otypesra,
                            Billto,
                            Billtoname,
                            Qty,
                            Price,
                            ROUND(Ext, 2) AS Ext,
                            Discount
                        FROM 
                            IPS.dbo.ips_daily_pre_ips_queries itm
                        JOIN 
                            (SELECT ITEMNO, [DESC] TITLE FROM TUTLIV.dbo.ICITEM) ttl
                            ON itm.ISBN = ttl.ITEMNO
                        WHERE 
                            Substring(Otypesra,1,1) = 'S'
                        OR 
                            Substring(Otypesra,1,1) = 'R'
                        `)
                return res.status(200).json(result.recordset);
            } catch (error) {
                if (error instanceof Error) {
                    console.error('DB error in reports get route: ', error.message);
                    return res.status(500).json({
                        error: 'Failed to fetch report details',
                        message: error.message
                    });
                }
            } finally {
                if (conn){
                    conn.close();
                }
            }
            break;
        default:
            return res.status(400).json({
                error: 'Invalid report type'
            });
    }

    
        
});


// Excel export endpoint
router.get("/:reportType/excel", async(req: Request<{reportType: string}>, res: Response)=> {
    let conn;
    
    const reportType = req.params.reportType;
    
    try {
        conn = await getConnection();
        let result: IResult<any>;
        let columns: string[] = [];
        
        switch(reportType) {
            case "INV_ADJ_CC_IPS":
            case "INV_ADJ_OH_ING":
            case "INV_ADJ_OH_IPS":
            case "INV_ADJ_CC_ING":
                columns = ['WHS', 'EAN', 'TITLE', 'QTY', 'REASON_CODE'];
                break;
            case "INV_RR":
                columns = ['WHS', 'ISBN', 'TITLE', 'QTY', 'REASON_CODE'];
                break;
            case "ADJ_S_R":
                columns = ['ISBN', 'TITLE', 'Ordnum', 'Otype', 'Ponumber', 'Otypesra', 'Billto', 'Billtoname', 'Qty', 'Price', 'Ext', 'Discount'];
                break;
            case "INV_TI":
                columns = ['WHS', 'EAN', 'TITLE', 'QTY', 'ACTTYPE'];
                break;
            default:
                return res.status(400).json({ error: 'Invalid report type' });
        }
        
        // Fetch data based on report type (reuse queries from above)
        switch(reportType) {
            case "INV_ADJ_CC_IPS":
                result = await conn.request().query(`
                    SELECT 
                        CAST(IPS.EAN AS Char(24)) AS EAN,
                        I.[DESC] as TITLE,
                        IPS.WHS,
                        IPS.Qty,
                        IPS.Acttype AS REASON_CODE
                    From IPS.dbo.IPS_INV as IPS LEFT JOIN TUTLIV.dbo.ICITEM I ON TRIM(I.ITEMNO) = TRIM(CAST(IPS.EAN AS Char(24)))
                    WHERE WHS = 'IPS' and Acttype = 'CC'`);
                break;
            case "INV_ADJ_OH_ING":
                result = await conn.request().query(`
                    SELECT
                        IPS.WHS,
                        CAST(IPS.EAN AS Char(24)) AS EAN,
                        I.[DESC] as TITLE,
                        IPS.Qty,
                        IPS.Acttype AS REASON_CODE
                    From IPS.dbo.IPS_INV as IPS LEFT JOIN TUTLIV.dbo.ICITEM I ON TRIM(I.ITEMNO) = TRIM(CAST(IPS.EAN AS Char(24)))
                    WHERE IPS.WHS = 'ING' and IPS.Acttype IN('OH','KA','KW')`);
                break;
            case "INV_TI":
                result = await conn.request().query(`
                    SELECT
                        IPS.WHS,
                        CAST(IPS.EAN AS Char(24)) AS EAN,
                        I.[DESC] as TITLE,
                        IPS.Qty,
                        IPS.Acttype
                    From IPS.dbo.IPS_INV as IPS LEFT JOIN TUTLIV.dbo.ICITEM I ON TRIM(I.ITEMNO) = TRIM(CAST(IPS.EAN AS Char(24)))
                    WHERE IPS.Acttype = 'TI'`);
                break;
            case "INV_ADJ_OH_IPS":
                result = await conn.request().query(`
                    SELECT
                        IPS.WHS,
                        CAST(IPS.EAN AS Char(24)) AS EAN,
                        I.[DESC] as TITLE,
                        IPS.Qty,
                        IPS.Acttype AS REASON_CODE
                    From IPS.dbo.IPS_INV as IPS LEFT JOIN TUTLIV.dbo.ICITEM I ON TRIM(I.ITEMNO) = TRIM(CAST(IPS.EAN AS Char(24)))
                    WHERE IPS.WHS = 'IPS' and IPS.Acttype IN('OH','KA','KW')`);
                break;
            case "INV_ADJ_CC_ING":
                result = await conn.request().query(`
                    SELECT
                        IPS.WHS,
                        CAST(IPS.EAN AS Char(24)) AS EAN,
                        I.[DESC] as TITLE,
                        IPS.Qty,
                        IPS.Acttype AS REASON_CODE
                    From IPS.dbo.IPS_INV as IPS LEFT JOIN TUTLIV.dbo.ICITEM I ON TRIM(I.ITEMNO) = TRIM(CAST(IPS.EAN AS Char(24)))
                    WHERE IPS.WHS = 'ING' and IPS.Acttype = 'CC'`);
                break;
            case "INV_RR":
                result = await conn.request().query(`
                    SELECT
                        IPS.WHS,
                        CAST(IPS.EAN AS Char(24)) AS ISBN,
                        I.[DESC] as TITLE,
                        IPS.Qty,
                        IPS.Acttype AS REASON_CODE
                    From IPS.dbo.IPS_INV as IPS LEFT JOIN TUTLIV.dbo.ICITEM I ON TRIM(I.ITEMNO) = TRIM(CAST(IPS.EAN AS Char(24)))
                    WHERE IPS.Acttype = 'RR'`);
                break;
            case "ADJ_S_R":
                result = await conn.request().query(`
                    SELECT
                        CAST(ISBN AS Char(24)) AS ISBN,
                        ttl.TITLE,
                        Ordnum,
                        Otype,
                        Ponumber,
                        Otypesra,
                        Billto,
                        Billtoname,
                        Qty,
                        Price,
                        Ext,
                        Discount
                    FROM 
                        IPS.dbo.ips_daily_pre_ips_queries itm
                    JOIN 
                        (SELECT ITEMNO, [DESC] TITLE FROM TUTLIV.dbo.ICITEM) ttl
                        ON itm.ISBN = ttl.ITEMNO
                    WHERE 
                        Substring(Otypesra,1,1) = 'S'
                    OR 
                        Substring(Otypesra,1,1) = 'R'`);
                break;
            default:
                return res.status(400).json({ error: 'Invalid report type' });
        }
        
        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(reportType);
        
        // Add headers with styling
        worksheet.columns = columns.map(col => ({
            header: col,
            key: col,
            width: 20
        }));
        
        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9D9D9' }
        };
        
        // Add data rows
        result.recordset.forEach(record => {
            worksheet.addRow(record);
        });
        
        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${reportType}_${new Date().toISOString().split('T')[0]}.xlsx"`
        );
        
        // Write to response
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (error) {
        if (error instanceof Error) {
            console.error('DB error in reports Excel export: ', error.message);
            return res.status(500).json({
                error: 'Failed to generate Excel report',
                message: error.message
            });
        }
    } finally {
        if (conn) {
            conn.close();
        }
    }
});


export default router;  