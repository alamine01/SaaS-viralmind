"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SidebarLinkGroup from "./SidebarLinkGroup";
import { useWorkspace } from "@/lib/workspace-context";
import { supabase } from "@/lib/supabase";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  variant?: "default" | "v2";
}

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  variant = "default",
}: SidebarProps) {
  const pathname = usePathname() || "";
  const router = useRouter();

  const { activeCollection, workspaces, setCreateModalOpen, setActiveCollection } = useWorkspace();
  const [quotas, setQuotas] = useState<any>(null);

  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLDivElement>(null);

  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(false);

  // Initial load & Quotas
  useEffect(() => {
    const storedSidebarExpanded = localStorage.getItem("sidebar-expanded");
    if (storedSidebarExpanded !== null) {
      setSidebarExpanded(storedSidebarExpanded === "true");
    }

    const fetchQuotas = async () => {
      try {
        const res = await fetch("/api/user/quotas");
        const data = await res.json();
        if (!data.error) setQuotas(data);
      } catch (e) {
        console.error("Error fetching quotas in sidebar:", e);
      }
    };
    fetchQuotas();

    window.addEventListener("quota-updated", fetchQuotas);
    return () => window.removeEventListener("quota-updated", fetchQuotas);
  }, []);

  useEffect(() => {
    const fetchQuotas = async () => {
      try {
        const res = await fetch("/api/user/quotas");
        const data = await res.json();
        if (!data.error) setQuotas(data);
      } catch (e) {
        console.error("Error fetching quotas in sidebar:", e);
      }
    };
    fetchQuotas();
  }, [pathname]);

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target as Node) ||
        trigger.current.contains(target as Node)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  useEffect(() => {
    localStorage.setItem("sidebar-expanded", sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.querySelector("body")?.classList.add("sidebar-expanded");
    } else {
      document.querySelector("body")?.classList.remove("sidebar-expanded");
    }
  }, [sidebarExpanded]);

  const handleSelectWorkspace = (slug: string) => {
    setActiveCollection(slug);
    router.push(`${pathname}?collection=${slug}`);
    setSidebarOpen(false);
  };

  const isAdminPage = pathname.startsWith("/admin");
  const plan = quotas?.plan?.toLowerCase() || "free";

  return (
    <div className="min-w-fit">
      {/* Sidebar backdrop (mobile only) */}
      <div
        className={`fixed inset-0 bg-gray-900/30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div
        id="sidebar"
        ref={sidebar}
        className={`flex lg:flex! flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 h-[100dvh] overflow-y-scroll lg:overflow-y-auto no-scrollbar w-64 ${sidebarExpanded ? "lg:w-64" : "lg:w-20"} shrink-0 bg-white dark:bg-gray-800 p-4 transition-all duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-64"
        } ${
          variant === "v2"
            ? "border-r border-gray-200 dark:border-gray-700/60"
            : "rounded-r-2xl shadow-xs"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex justify-between items-center mb-10 pr-3 sm:px-2">
          {/* Close button */}
          <button
            ref={trigger}
            className="lg:hidden text-gray-500 hover:text-gray-400"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
          >
            <span className="sr-only">Close sidebar</span>
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.7 18.7l1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4L4 12z" />
            </svg>
          </button>
          {/* Logo */}
          <Link href="/dashboard" className="block">
            <svg className="fill-violet-500" xmlns="http://www.w3.org/2000/svg" width={32} height={32}>
              <path d="M31.956 14.8C31.372 6.92 25.08.628 17.2.044V5.76a9.04 9.04 0 0 0 9.04 9.04h5.716ZM14.8 26.24v5.716C6.92 31.372.63 25.08.044 17.2H5.76a9.04 9.04 0 0 1 9.04 9.04Zm11.44-9.04h5.716c-.584 7.88-6.876 14.172-14.756 14.756V26.24a9.04 9.04 0 0 1 9.04-9.04ZM.044 14.8C.63 6.92 6.92.628 14.8.044V5.76a9.04 9.04 0 0 1-9.04 9.04H.044Z" />
            </svg>
          </Link>
          <button className="hidden lg:block text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onClick={() => setSidebarExpanded(!sidebarExpanded)}>
            <svg className={`w-5 h-5 transition-transform duration-200 ${sidebarExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Links */}
        <div className="space-y-8 flex-1">
          {/* Pages group */}
          <div>
            <h3 className="text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold pl-3">
              <span className={`hidden text-center w-6 ${!sidebarExpanded ? "lg:block" : "lg:hidden"}`} aria-hidden="true">
                •••
              </span>
              <span className={`lg:block ${!sidebarExpanded ? "lg:hidden" : ""}`}>
                Menu
              </span>
            </h3>
            <ul className="mt-3 space-y-1">
              
              {/* Dashboard */}
              <li className={`pl-4 pr-3 py-2 rounded-lg mb-0.5 last:mb-0 bg-linear-to-r ${pathname === "/dashboard" ? "from-violet-500/[0.12] dark:from-violet-500/[0.24] to-violet-500/[0.04]" : ""}`}>
                <Link
                  href="/dashboard"
                  className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${pathname === "/dashboard" ? "" : "hover:text-gray-900 dark:hover:text-white"}`}
                >
                  <div className="flex items-center">
                    <svg className={`shrink-0 fill-current ${pathname === "/dashboard" ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M5.936.278A7.983 7.983 0 0 1 8 0a8 8 0 1 1-8 8c0-.722.104-1.413.278-2.064a1 1 0 1 1 1.932.516A5.99 5.99 0 0 0 2 8a6 6 0 1 0 6-6c-.53 0-1.045.076-1.548.21A1 1 0 1 1 5.936.278Z" />
                      <path d="M6.068 7.482A2.003 2.003 0 0 0 8 10a2 2 0 1 0-.518-3.932L3.707 2.293a1 1 0 0 0-1.414 1.414l3.775 3.775Z" />
                    </svg>                            
                    <span className={`text-sm font-medium ml-4 transition-opacity duration-200 ${!sidebarExpanded ? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"}`}>
                      Tableau de bord
                    </span>
                  </div>
                </Link>
              </li>

              {/* Feed */}
              <li className={`pl-4 pr-3 py-2 rounded-lg mb-0.5 last:mb-0 bg-linear-to-r ${pathname === "/feed" ? "from-violet-500/[0.12] dark:from-violet-500/[0.24] to-violet-500/[0.04]" : ""}`}>
                <Link
                  href="/feed"
                  className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${pathname === "/feed" ? "" : "hover:text-gray-900 dark:hover:text-white"}`}
                >
                  <div className="flex items-center">
                    <svg className={`shrink-0 fill-current ${pathname === '/feed' ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M12 1a1 1 0 1 0-2 0v2a3 3 0 0 0 3 3h2a1 1 0 1 0 0-2h-2a1 1 0 0 1-1-1V1ZM1 10a1 1 0 1 0 0 2h2a1 1 0 0 1 1 1v2a1 1 0 1 0 2 0v-2a3 3 0 0 0-3-3H1ZM5 0a1 1 0 0 1 1 1v2a3 3 0 0 1-3 3H1a1 1 0 0 1 0-2h2a1 1 0 0 0 1-1V1a1 1 0 0 1 1-1ZM12 13a1 1 0 0 1 1-1h2a1 1 0 1 0 0-2h-2a3 3 0 0 0-3 3v2a1 1 0 1 0 2 0v-2Z" />
                    </svg>
                    <span className={`text-sm font-medium ml-4 transition-opacity duration-200 ${!sidebarExpanded ? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"}`}>
                      Flux Viral
                    </span>
                  </div>
                </Link>
              </li>

              {/* Analyse */}
              <li className={`pl-4 pr-3 py-2 rounded-lg mb-0.5 last:mb-0 bg-linear-to-r ${pathname === "/analyse" ? "from-violet-500/[0.12] dark:from-violet-500/[0.24] to-violet-500/[0.04]" : ""}`}>
                <Link
                  href="/analyse"
                  className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${pathname === "/analyse" ? "" : "hover:text-gray-900 dark:hover:text-white"}`}
                >
                  <div className="flex items-center">
                    <svg className={`shrink-0 fill-current ${pathname === '/analyse' ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M6 0a6 6 0 0 0-6 6c0 1.077.304 2.062.78 2.912a1 1 0 1 0 1.745-.976A3.945 3.945 0 0 1 2 6a4 4 0 0 1 4-4c.693 0 1.344.194 1.936.525A1 1 0 1 0 8.912.779 5.944 5.944 0 0 0 6 0Z" />
                      <path d="M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm-4 6a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" />
                    </svg>
                    <span className={`text-sm font-medium ml-4 transition-opacity duration-200 ${!sidebarExpanded ? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"}`}>
                      Analyse de Niche
                    </span>
                  </div>
                </Link>
              </li>

              {/* Profil de Voix (only Visionary/Titan) */}
              {(plan === "visionary" || plan === "titan") && (
                <li className={`pl-4 pr-3 py-2 rounded-lg mb-0.5 last:mb-0 bg-linear-to-r ${pathname === "/voice" ? "from-violet-500/[0.12] dark:from-violet-500/[0.24] to-violet-500/[0.04]" : ""}`}>
                  <Link
                    href="/voice"
                    className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${pathname === "/voice" ? "" : "hover:text-gray-900 dark:hover:text-white"}`}
                  >
                    <div className="flex items-center">
                      <svg className={`shrink-0 fill-current ${pathname === '/voice' ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M8 1a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM4.5 4.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z" />
                        <path d="M11 13a3 3 0 0 0-6 0H3a5 5 0 0 1 10 0h-2Z" />
                      </svg>
                      <span className={`text-sm font-medium ml-4 transition-opacity duration-200 ${!sidebarExpanded ? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"}`}>
                        Profil de Voix
                      </span>
                    </div>
                  </Link>
                </li>
              )}

              {/* Surveillance Radar (only Visionary/Titan) */}
              {(plan === "visionary" || plan === "titan") && (
                <li className={`pl-4 pr-3 py-2 rounded-lg mb-0.5 last:mb-0 bg-linear-to-r ${pathname === "/monitoring" ? "from-violet-500/[0.12] dark:from-violet-500/[0.24] to-violet-500/[0.04]" : ""}`}>
                  <Link
                    href="/monitoring"
                    className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${pathname === "/monitoring" ? "" : "hover:text-gray-900 dark:hover:text-white"}`}
                  >
                    <div className="flex items-center">
                      <svg className={`shrink-0 fill-current ${pathname === '/monitoring' ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
                        <path d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
                      </svg>
                      <span className={`text-sm font-medium ml-4 transition-opacity duration-200 ${!sidebarExpanded ? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"}`}>
                        Surveillance Radar
                      </span>
                    </div>
                  </Link>
                </li>
              )}

              {/* Scripts */}
              <li className={`pl-4 pr-3 py-2 rounded-lg mb-0.5 last:mb-0 bg-linear-to-r ${pathname === "/scripts" ? "from-violet-500/[0.12] dark:from-violet-500/[0.24] to-violet-500/[0.04]" : ""}`}>
                <Link
                  href="/scripts"
                  className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${pathname === "/scripts" ? "" : "hover:text-gray-900 dark:hover:text-white"}`}
                >
                  <div className="flex items-center">
                    <svg className={`shrink-0 fill-current ${pathname === '/scripts' ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M7.586 9H1a1 1 0 1 1 0-2h6.586L6.293 5.707a1 1 0 0 1 1.414-1.414l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 1 1-1.414-1.414L7.586 9ZM3.075 4.572a1 1 0 1 1-1.64-1.144 8 8 0 1 1 0 9.144 1 1 0 0 1 1.64-1.144 6 6 0 1 0 0-6.856Z" />
                    </svg>
                    <span className={`text-sm font-medium ml-4 transition-opacity duration-200 ${!sidebarExpanded ? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"}`}>
                      Générateur de Scripts
                    </span>
                  </div>
                </Link>
              </li>

              {/* Transcriptions */}
              <li className={`pl-4 pr-3 py-2 rounded-lg mb-0.5 last:mb-0 bg-linear-to-r ${pathname === "/transcription" ? "from-violet-500/[0.12] dark:from-violet-500/[0.24] to-violet-500/[0.04]" : ""}`}>
                <Link
                  href="/transcription"
                  className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${pathname === "/transcription" ? "" : "hover:text-gray-900 dark:hover:text-white"}`}
                >
                  <div className="flex items-center">
                    <svg className={`shrink-0 fill-current ${pathname === '/transcription' ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M13.95.879a3 3 0 0 0-4.243 0L1.293 9.293a1 1 0 0 0-.274.51l-1 5a1 1 0 0 0 1.177 1.177l5-1a1 1 0 0 0 .511-.273l8.414-8.414a3 3 0 0 0 0-4.242L13.95.879ZM11.12 2.293a1 1 0 0 1 1.414 0l1.172 1.172a1 1 0 0 1 0 1.414l-8.2 8.2-3.232.646.646-3.232 8.2-8.2Z" />
                      <path d="M10 14a1 1 0 1 0 0 2h5a1 1 0 1 0 0-2h-5Z" />
                    </svg>
                    <span className={`text-sm font-medium ml-4 transition-opacity duration-200 ${!sidebarExpanded ? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"}`}>
                      Transcription Audio
                    </span>
                  </div>
                </Link>
              </li>

              {/* Hooks */}
              <li className={`pl-4 pr-3 py-2 rounded-lg mb-0.5 last:mb-0 bg-linear-to-r ${pathname === "/hooks" ? "from-violet-500/[0.12] dark:from-violet-500/[0.24] to-violet-500/[0.04]" : ""}`}>
                <Link
                  href="/hooks"
                  className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${pathname === "/hooks" ? "" : "hover:text-gray-900 dark:hover:text-white"}`}
                >
                  <div className="flex items-center">
                    <svg className={`shrink-0 fill-current ${pathname === '/hooks' ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M14.9 3.1 12.5.7A1.943 1.943 0 0 0 11.1 0 1.943 1.943 0 0 0 9.7.7L2.1 8.3a1.943 1.943 0 0 0-.7 1.4L1 14.1a.986.986 0 0 0 .3.7.986.986 0 0 0 .7.3h.1l4.4-.4a1.943 1.943 0 0 0 1.4-.7l7.6-7.6a1.943 1.943 0 0 0 .7-1.4 1.943 1.943 0 0 0-.6-1.9ZM3 13 3.3 10.3l5-5L10.7 7.7l-5 5H3Zm8.9-6.3-2.4-2.4L11.1 2.7l2.4 2.4-1.6 1.6Z" />
                    </svg>
                    <span className={`text-sm font-medium ml-4 transition-opacity duration-200 ${!sidebarExpanded ? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"}`}>
                      Bibliothèque de Hooks
                    </span>
                  </div>
                </Link>
              </li>

              {/* Calendar */}
              <li className={`pl-4 pr-3 py-2 rounded-lg mb-0.5 last:mb-0 bg-linear-to-r ${pathname === "/calendar" ? "from-violet-500/[0.12] dark:from-violet-500/[0.24] to-violet-500/[0.04]" : ""}`}>
                <Link
                  href="/calendar"
                  className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${pathname === "/calendar" ? "" : "hover:text-gray-900 dark:hover:text-white"}`}
                >
                  <div className="flex items-center">
                    <svg className={`shrink-0 fill-current ${pathname === '/calendar' ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M4 1a1 1 0 0 1 2 0v1h4V1a1 1 0 0 1 2 0v1h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h1V1ZM3 6v8h10V6H3Z" />
                    </svg>
                    <span className={`text-sm font-medium ml-4 transition-opacity duration-200 ${!sidebarExpanded ? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"}`}>
                      Calendrier
                    </span>
                  </div>
                </Link>
              </li>

              {/* Saved */}
              <li className={`pl-4 pr-3 py-2 rounded-lg mb-0.5 last:mb-0 bg-linear-to-r ${pathname === "/saved" ? "from-violet-500/[0.12] dark:from-violet-500/[0.24] to-violet-500/[0.04]" : ""}`}>
                <Link
                  href="/saved"
                  className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${pathname === "/saved" ? "" : "hover:text-gray-900 dark:hover:text-white"}`}
                >
                  <div className="flex items-center">
                    <svg className={`shrink-0 fill-current ${pathname === '/saved' ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M14 2H2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2ZM2 4h12v10H2V4Zm2 2v6l3-2 3 2V6H4Z" />
                    </svg>
                    <span className={`text-sm font-medium ml-4 transition-opacity duration-200 ${!sidebarExpanded ? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"}`}>
                      Bibliothèque
                    </span>
                  </div>
                </Link>
              </li>

              {/* Settings */}
              <li className={`pl-4 pr-3 py-2 rounded-lg mb-0.5 last:mb-0 bg-linear-to-r ${pathname === "/settings" ? "from-violet-500/[0.12] dark:from-violet-500/[0.24] to-violet-500/[0.04]" : ""}`}>
                <Link
                  href="/settings"
                  className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${pathname === "/settings" ? "" : "hover:text-gray-900 dark:hover:text-white"}`}
                >
                  <div className="flex items-center">
                    <svg className={`shrink-0 fill-current ${pathname === '/settings' ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10.5 1a3.502 3.502 0 0 1 3.355 2.5H15a1 1 0 1 1 0 2h-1.145a3.502 3.502 0 0 1-6.71 0H1a1 1 0 0 1 0-2h6.145A3.502 3.502 0 0 1 10.5 1ZM8 4.5a2 2 0 1 0 5 0 2 2 0 0 0-5 0ZM5.5 9a3.502 3.502 0 0 1 3.355 2.5H15a1 1 0 1 1 0 2H8.855a3.502 3.502 0 0 1-6.71 0H1a1 1 0 1 1 0-2h1.145A3.502 3.502 0 0 1 5.5 9ZM3 12.5a2 2 0 1 0 5 0 2 2 0 0 0-5 0Z" />
                    </svg>
                    <span className={`text-sm font-medium ml-4 transition-opacity duration-200 ${!sidebarExpanded ? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"}`}>
                      Paramètres
                    </span>
                  </div>
                </Link>
              </li>

              {/* Admin */}
              {quotas?.role === "admin" && (
                <SidebarLinkGroup activecondition={pathname.includes("/admin")}>
                  {(handleClick, open) => {
                    return (
                      <React.Fragment>
                        <a
                          href="#0"
                          className={`block text-gray-800 dark:text-gray-100 truncate transition duration-150 ${pathname.includes("/admin") ? "" : "hover:text-gray-900 dark:hover:text-white"}`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleClick();
                            setSidebarExpanded(true);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <svg className={`shrink-0 fill-current ${pathname.includes('/admin') ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                                <path d="M8 1a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM4.5 4.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z" />
                                <path d="M11 13a3 3 0 0 0-6 0H3a5 5 0 0 1 10 0h-2Z" />
                              </svg>
                              <span className={`text-sm font-medium ml-4 transition-opacity duration-200 ${!sidebarExpanded ? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"}`}>
                                Administration
                              </span>
                            </div>
                            {/* Icon */}
                            <div className="flex shrink-0 ml-2">
                              <svg className={`w-3 h-3 shrink-0 ml-1 fill-current text-gray-400 dark:text-gray-500 ${open && "rotate-180"}`} viewBox="0 0 12 12">
                                <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
                              </svg>
                            </div>
                          </div>
                        </a>
                        <div className="lg:block">
                          <ul className={`pl-8 mt-1 ${!open && "hidden"}`}>
                            <li className="mb-1 last:mb-0">
                              <Link
                                href="/admin"
                                className={"block transition duration-150 truncate " + (pathname === "/admin" ? "text-violet-500" : "text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")}
                              >
                                <span className={`text-sm font-medium transition-opacity duration-200 ${!sidebarExpanded ? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"}`}>
                                  Dashboard Admin
                                </span>
                              </Link>
                            </li>
                            <li className="mb-1 last:mb-0">
                              <Link
                                href="/admin/users"
                                className={"block transition duration-150 truncate " + (pathname === "/admin/users" ? "text-violet-500" : "text-gray-500/90 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")}
                              >
                                <span className={`text-sm font-medium transition-opacity duration-200 ${!sidebarExpanded ? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"}`}>
                                  Utilisateurs
                                </span>
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </React.Fragment>
                    );
                  }}
                </SidebarLinkGroup>
              )}

            </ul>
          </div>
          
          {/* Workspaces List inside Sidebar */}
          <div className="mt-8">
            <h3 className="text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold pl-3 mb-3">
              <span className={`hidden text-center w-6 ${!sidebarExpanded ? "lg:block" : "lg:hidden"}`} aria-hidden="true">
                •••
              </span>
              <span className={`flex justify-between items-center pr-4 ${!sidebarExpanded ? "lg:hidden" : "lg:flex"}`}>
                Workspaces
                <button onClick={() => setCreateModalOpen(true)} className="ml-2 hover:text-violet-500">
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 16 16"><path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z"/></svg>
                </button>
              </span>
            </h3>
            <ul className="mt-3 space-y-1">
              {workspaces.map((ws) => {
                const isActive = activeCollection === ws.slug;
                return (
                  <li key={ws.slug} className={`pl-4 pr-3 py-2 rounded-lg mb-0.5 last:mb-0 ${isActive ? "bg-gray-100 dark:bg-gray-700/50" : ""}`}>
                    <button
                      onClick={() => handleSelectWorkspace(ws.slug)}
                      className="w-full flex items-center text-left"
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${ws.color}`} />
                      <span className={`text-sm font-medium ml-3 transition-opacity duration-200 ${!sidebarExpanded ? "lg:opacity-0 lg:hidden" : "lg:opacity-100 lg:block"} ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                        {ws.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        
        {/* Quotas Section */}
        {quotas && !isAdminPage && (
          <div className={`mt-auto pt-6 duration-200 hidden ${sidebarExpanded ? "lg:block" : "lg:hidden"}`}>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/60 shadow-sm">
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                    <span>Scripts IA (jour)</span>
                    <span>{quotas.daily_script_count} / {quotas.limits.dailyScripts === 9999 ? "∞" : quotas.limits.dailyScripts}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-violet-500 rounded-full transition-all duration-500"
                      style={{ width: `${quotas.limits.dailyScripts === 9999 ? 5 : Math.min(100, (quotas.daily_script_count / (quotas.limits.dailyScripts || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                    <span>Analyses (mois)</span>
                    <span>{quotas.monthly_analysis_count} / {quotas.limits.monthlyAnalysis}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-sky-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (quotas.monthly_analysis_count / (quotas.limits.monthlyAnalysis || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
