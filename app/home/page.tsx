"use client";
import React from "react";
import Header from "@/components/header/header";
import { useUser } from "../../context/UserContext";
import GCalendar from "@/components/Gcalendar/Gcalendar";
import Gcard from "@/components/Gcard/Gcard";

const events = [
  {
    title: "Soirée Networking",
    date: "2024-07-01T19:00:00",
    profiles: [
      "/img/user1.jpg",
      "/img/user2.jpg",
      "/img/user3.jpg",
      "/img/user4.jpg",
      "/img/user5.jpg",
    ],
    backgroundUrl: "/images/illustration/roundstar.svg",
  },
    {
    title: "Bar-mitzvahs",
    date: "2024-07-01T19:00:00",
    profiles: [
      "/img/user1.jpg",
      "/img/user2.jpg",
      "/img/user3.jpg",
      "/img/user4.jpg",
      "/img/user5.jpg",
    ],
    backgroundUrl: "/images/illustration/palm.svg",
  },
    {
    title: "Soirée caca",
    date: "2024-07-01T19:00:00",
    profiles: [
      "/img/user1.jpg",
      "/img/user2.jpg",
      "/img/user3.jpg",
      "/img/user4.jpg",
      "/img/user5.jpg",
    ],
    backgroundUrl: "/images/illustration/stack.svg",
  },

];

export default function HomePage() {
    const { user, isLoading, logout } = useUser();
    return (
        <>
        <Header />
        <main className="flex min-h-screen flex-col p-8 bg-gray-50">
        
            
            <section>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Bienvenue,
                </h1>
                <div className="flex items-center">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {user?.name || "invité"}
                </h1>
                <img src="/images/icones/pastille.svg" alt="pastille"></img>
                </div>
                
            </section>

            <section id="calendar" className=" py-15">
                <h2 className="text-xl font-bold text-left mb-4 text-gray-800">
                    Calendrier des Evènements
                </h2>
                <GCalendar year={2024} />
            </section>
            <section>
                <h2 className="text-xl font-bold text-left mb-4 text-gray-800">
                    Evènement à venir
                </h2>
                <div className="flex gap-4">
                {events.map((event, idx) => (
                    <Gcard 
                    key={idx} {...event}
                    className="w-120 h-60" />
                ))}
                <button className="w-20 h-60 rounded-xl border-1 border-gray-200">
                </button>
                </div>

            </section>

        </main>
        </>
    );
}