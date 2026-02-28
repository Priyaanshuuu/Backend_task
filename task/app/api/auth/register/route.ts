import {NextRequest , NextResponse} from "next/server"
import {ZodError} from "zod"
import { RegisterSchema } from "@/lib/validators/authSchema" 
import  {registerUser} from "@/lib/services/authService"
import {successResponse , badRequest , errorResponse} from "@/lib/utils/apiResponse"

const REFRESH_TOKEN_MAX_AGE = 7*24*60*60

export async function POST(req: NextRequest) : Promise<NextResponse>{
    try{
        const body : unknown = await req.json();
        const input = RegisterSchema.parse(body)

        const {user , tokens} = await registerUser(input)

        const response = successResponse({user , accessToken: tokens.accessToken} , 201)
        response.cookies.set("refreshToken" , tokens.refreshToken , {
            httpOnly : true,
            secure : process.env.NODE_ENV === "production",
            sameSite : "strict",
            maxAge : REFRESH_TOKEN_MAX_AGE,
            path : "/api/auth/refresh"
        })
        return response;
    }catch(error){
        if(error instanceof ZodError) {
            return badRequest(error.message ?? "Validation failed")
        }
        if(error instanceof Error){
            return errorResponse(error.message , 409 , "EMAIL_TAKEN");
        }

        console.error("POST api/auth/register" , error)
        return errorResponse("Registration failed" , 500)
    }
}