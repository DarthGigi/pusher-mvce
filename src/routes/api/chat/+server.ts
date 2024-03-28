import { app_id, secret } from "$env/static/private";
import { PUBLIC_USER_ID } from "$env/static/public";
import { PUBLIC_cluster, PUBLIC_key } from "$env/static/public";
import Pusher from "pusher";
import type { RequestHandler } from "../$types";

const pusher = new Pusher({
  appId: app_id,
  key: PUBLIC_key,
  secret: secret,
  cluster: PUBLIC_cluster,
  useTLS: true
});

export const POST: RequestHandler = async ({ locals, request, params, url }) => {
  const body = await request.json();

  // max message size
  if (body.content.toString().length > 1000) {
    throw new Response("Message exceeds max 1000 characters", {
      status: 413,
      statusText: "Message exceeds max 1000 characters"
    });
  }

  interface Message {
    id?: string;
    chat_id: string;
    user_id: string;
    content: string;
    createdAt: Date;
  }

  pusher
    .trigger(`chat-chatID`, "new-message", {
      chat_id: "chatID",
      user_id: PUBLIC_USER_ID,
      content: body.content as string,
      createdAt: body.createdAt
    } as Message)
    .then(async (res) => {
      if (res.status === 200) {
        // in the actual app, the message will be saved to the database here
      }
    })
    .catch((err) => {
      console.error(err);
      switch (err.statusCode) {
        case 400:
          return new Response(err.body, {
            status: 400,
            statusText: "Bad Request"
          });
        case 401:
          return new Response(err.body, {
            status: 401,
            statusText: "Unauthorized"
          });
        case 403:
          return new Response(err.body, {
            status: 403,
            statusText: "Forbidden"
          });
        default:
          return new Response(err.body, {
            status: 500,
            statusText: "Internal Server Error"
          });
      }
    });

  return new Response(JSON.stringify({}), {
    status: 201,
    statusText: "Created",
    headers: {
      "content-type": "application/json"
    }
  });
};
