
import type { Request, Response, NextFunction } from "express";


export function requireApiKey(req: Request, res: Response, next: NextFunction) {

    if (!req.headers["x-api-key"]) {
        res.status(401).json({
            ok: false,
            error: "Missing API key"
        })
        return
    }
    if (req.headers["x-api-key"] !== process.env.API_KEY) {
        res.status(401).json({
            ok: false,
            error: "Invalid API key"
        })
        return
    }

    next()

}