import {NextRequest , NextResponse} from "next/server"
import {refreshAccessToken} from "@/lib/services/authService"
import {successResponse , unauthorized , errorResponse} from "@/lib/utils/apiResponse"

export async function POST(req: NextRequest) : Promise<NextResponse>{
    try{
        const refreshToken = req.cookies.get("refreshToken")?.value

        if(!refreshToken){
            return unauthorized("No refresh token provided")
        } 
        const {accessToken} = await refreshAccessToken(refreshToken)
        return successResponse({accessToken})
    }catch(error){
        if(error instanceof Error && error.message.includes("invalid or expired")){
            return unauthorized(error.message)
        }
        console.error("POST api/auth/refresh" , error)
        return errorResponse("Token refresh failed" , 500)
    }
}