"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Send, Search, Check } from "lucide-react";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
};

type Profile = {
  id: string;
  company_name: string | null;
  avatar_url: string | null;
  // ⛔️ email removed: profiles table doesn’t have it
};

export default function MessagesPage() {
  const [me, setMe] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<
    { partner: Profile; lastMsg?: Message; unread: number }[]
  >([]);
  const [chatUser, setChatUser] = useState<Profile | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");

  // Get logged-in user + check admin
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMe(user.id);

      const { data: p } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      setIsAdmin(p?.is_admin === true || p?.is_admin === "t");
    })();
  }, []);

  // Fetch conversations (left sidebar)
  useEffect(() => {
    if (!me) return;
    (async () => {
      let msgs: Message[] = [];

      if (isAdmin) {
        const { data } = await supabase
          .from("messages")
          .select("*")
          .order("created_at", { ascending: false });
        msgs = data || [];
      } else {
        const { data } = await supabase
          .from("messages")
          .select("*")
          .or(`sender_id.eq.${me},receiver_id.eq.${me}`)
          .order("created_at", { ascending: false });
        msgs = data || [];
      }

      console.log("Fetched msgs:", msgs);

      if (!msgs.length) {
        setConversations([]);
        return;
      }

      // Build partner ids
      let partnerIds: string[] = [];
      if (isAdmin) {
        partnerIds = [
          ...new Set([
            ...msgs.map((m) => m.sender_id),
            ...msgs.map((m) => m.receiver_id),
          ]),
        ].filter((id) => id && id !== me);
      } else {
        partnerIds = [
          ...new Set(
            msgs.map((m) => (m.sender_id === me ? m.receiver_id : m.sender_id))
          ),
        ].filter(Boolean) as string[];
      }

      // ⛔️ Avoid id=in.() → skip fetch when empty
      if (partnerIds.length === 0) {
        setConversations([]);
        return;
      }

      // Fetch partner profiles (NO email column)
      let profiles: Profile[] = [];
      const { data: profs, error: profErr } = await supabase
        .from("profiles")
        .select("id, company_name, avatar_url")
        .in("id", partnerIds);

      if (profErr) {
        console.error("profiles fetch error:", profErr);
      } else {
        profiles = profs || [];
      }

      // Build conversation list with safe fallbacks
      const convs = partnerIds.map((pid) => {
        const partner =
          profiles.find((p) => p.id === pid) ||
          ({ id: pid, company_name: null, avatar_url: null } as Profile);

        const lastMsg = msgs.find(
          (m) => m.sender_id === pid || m.receiver_id === pid
        );

        const unread = msgs.filter(
          (m) => m.sender_id === pid && !m.read && m.receiver_id === me
        ).length;

        return { partner, lastMsg, unread };
      });

      setConversations(convs);
    })();
  }, [me, isAdmin]);

  // Fetch messages with selected user (right panel)
  useEffect(() => {
    if (!me || !chatUser) return;

    (async () => {
      let { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${me},receiver_id.eq.${chatUser.id}),and(sender_id.eq.${chatUser.id},receiver_id.eq.${me})`
        )
        .order("created_at", { ascending: true });

      if (isAdmin) {
        const { data: adminMsgs } = await supabase
          .from("messages")
          .select("*")
          .or(`sender_id.eq.${chatUser.id},receiver_id.eq.${chatUser.id}`)
          .order("created_at", { ascending: true });
        data = adminMsgs;
      }

      console.log("Chat messages:", data);
      setMessages(data || []);

      // Mark as read (only the ones I received)
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("receiver_id", me)
        .eq("sender_id", chatUser.id)
        .eq("read", false);
    })();

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          if (
            (msg.sender_id === me && msg.receiver_id === chatUser.id) ||
            (msg.sender_id === chatUser.id && msg.receiver_id === me) ||
            (isAdmin &&
              (msg.sender_id === chatUser.id ||
                msg.receiver_id === chatUser.id))
          ) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? (payload.new as Message) : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [me, chatUser, isAdmin]);

  const sendMessage = async () => {
    if (!me || !chatUser || !newMessage.trim()) return;
    await supabase.from("messages").insert({
      sender_id: me,
      receiver_id: chatUser.id,
      content: newMessage,
    });
    setNewMessage("");
  };

  const displayName = (p?: Profile | null) =>
    (p?.company_name && p.company_name.trim()) || "User";

  const avatarUrl = (p?: Profile | null) =>
    p?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName(p))}`;

  return (
    <div className="h-[calc(100vh-60px)] flex text-white">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 70 }}
        className="w-72 bg-gray-950/70 border-r border-white/10 flex flex-col"
      >
        <div className="p-3 flex items-center bg-gray-900/60">
          <Search className="text-gray-400 mr-2" size={18} />
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent flex-1 outline-none text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations
            .filter((c) =>
              displayName(c.partner).toLowerCase().includes(search.toLowerCase())
            )
            .map((c) => (
              <div
                key={c.partner.id}
                onClick={() => setChatUser(c.partner)}
                className={`flex items-center p-3 cursor-pointer hover:bg-gray-800/50 transition-all ${
                  chatUser?.id === c.partner.id ? "bg-gray-800/70" : ""
                }`}
              >
                <img
                  src={avatarUrl(c.partner)}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover mr-3"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{displayName(c.partner)}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {c.lastMsg?.content || "—"}
                  </p>
                </div>
                <div className="text-xs text-gray-500 text-right">
                  {c.lastMsg?.created_at &&
                    new Date(c.lastMsg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  {c.unread > 0 && (
                    <span className="block bg-blue-600 text-white rounded-full px-2 py-0.5 text-[10px] mt-1">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </motion.div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-950 to-gray-900">
        {chatUser ? (
          <>
            <div className="p-4 border-b border-white/10 font-bold">
              {displayName(chatUser)}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={`p-3 rounded-2xl max-w-xs ${
                    msg.sender_id === me
                      ? "ml-auto bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-100"
                  }`}
                >
                  <div className="flex items-end gap-2">
                    <span>{msg.content}</span>
                    {msg.sender_id === me && (
                      <Check
                        size={14}
                        className={msg.read ? "text-blue-300" : "text-gray-400"}
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="p-4 border-t border-white/10 flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-2 rounded-xl bg-gray-800 text-white focus:outline-none"
              />
              <button
                onClick={sendMessage}
                className="ml-3 p-3 bg-blue-600 rounded-xl text-white"
              >
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-gray-400">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
