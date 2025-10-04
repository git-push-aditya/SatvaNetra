import { NextResponse } from "next/server";
import bcrypt from 'bcrypt';
import { PrismaClient } from "@prisma/client";
const client = new PrismaClient();
export async function POST(req : Request){ 
    const {userName, password} = await req.json();
    try {
        const checkUser = await client.user.findFirst({
            where: {
                userName: userName
            },
            select: {
                password: true,
                id: true
            }
        })

        if (checkUser) {

            const verify = await bcrypt.compare(password, checkUser.password);

            if (verify) {
                return NextResponse.json({message: 'Signed in successfully'},{status : 200})

            } else {
                return NextResponse.json({message: "Unautorised access/incorrect password"},{status: 401})
            }


        } else {
            return NextResponse.json({message: "Unautorised access/incorrect password"},{status: 404})
        }

        return;

    } catch (e:any) {
	    console.log(e.message) 
        return NextResponse.json({message: "Unautorised access/incorrect password"},{status: 405})
    }
}

