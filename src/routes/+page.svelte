<script lang="ts">
  import { PUBLIC_cluster, PUBLIC_key } from "$env/static/public";
  import Pusher from "pusher-js";
  import { PUBLIC_USER_ID } from "$env/static/public";

  interface iMessage {
    id?: string;
    chat_id: string;
    user_id: string;
    content: string;
    createdAt: Date;
    animate?: boolean;
  }

  let timeout: NodeJS.Timeout;
  let newChats: iMessage[] = [];
  let messages: iMessage[] = [];
  let sentMessageSuccess: boolean | undefined | null = null;
  let value: string;

  $: newChats;
  $: messages;

  const pusher = new Pusher(PUBLIC_key, {
    cluster: PUBLIC_cluster
  });

  const channel = pusher.subscribe(`chat-chatID`).bind_global((eventName: string, new_message: iMessage) => {
    console.log(eventName, new_message);
    if (eventName !== "new-message") return;
    sentMessageSuccess = null;
    new_message.createdAt = new Date(new_message.createdAt);
    new_message.animate = true;
    if (new_message.user_id === PUBLIC_USER_ID) {
      messages = [...messages, new_message];
      newChats = newChats.filter((message) => message.id === new_message.id);
      sentMessageSuccess = true;
      clearTimeout(timeout);
      value = "";
      timeout = setTimeout(() => {
        sentMessageSuccess = null;
      }, 1000);
    } else {
      messages = [...messages, new_message];
    }
  });

  const sendMessage = async () => {
    const textValue = value.trim();
    if (!textValue) return;
    const message = {
      content: textValue,
      createdAt: new Date(),
      user_id: PUBLIC_USER_ID,
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      chat_id: "chatID"
    };
    newChats = [...newChats, message];
    sentMessageSuccess = undefined;

    await fetch(`${window.location.href}api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "fetch"
      },
      body: JSON.stringify(message)
    });
  };
</script>

<form on:submit|preventDefault={sendMessage}>
  <input type="text" bind:value placeholder="Type a message" />
  <button type="submit" class="mr-8">Send</button>
  {#if sentMessageSuccess === true}
    <span>Sent</span>
  {/if}

  {#if sentMessageSuccess === false}
    <span>Failed to send</span>
  {/if}

  {#if sentMessageSuccess === undefined}
    <span>Sending...</span>
  {/if}
</form>

{#each messages as message}
  <div class="">
    <p>{message.content}</p>
    <small>{message.createdAt.toLocaleTimeString()}</small>
  </div>
{/each}
