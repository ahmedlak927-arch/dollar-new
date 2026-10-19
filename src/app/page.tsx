"use client";

import { useEffect, useState } from "react";

type Language = "en" | "ar" | "ku";
type Theme = "dark" | "light";

interface CurrencyData {
  USD?: string;
  EUR?: string;
  GBP?: string;
  TRY?: string;
  CNY?: string;
  GOLD_22?: string;
  GOLD_21?: string;
  GOLD_18?: string;
  createdAt?: string;
}

const translations = {
  en: {
    title: "Erbil Market Rates",
    subtitle: "Live financial currency & gold tracking",
    currenciesTitle: "Foreign Currencies",
    goldTitle: "Precious Gold",
    updatedAt: "Last Synced",
    loading: "Fetching live market rates...",
    error: "Unable to connect to market server. Try again shortly.",
    noData: "No active rates recorded yet.",
    currencies: { USD: "US Dollar", EUR: "Euro", GBP: "British Pound", TRY: "Turkish Lira", CNY: "Chinese Yuan" },
    gold: { GOLD_22: "22-Karat Gold", GOLD_21: "21-Karat Gold", GOLD_18: "18-Karat Gold" },
  },
  ar: {
    title: "أسعار سوق اربيل",
    subtitle: "تتبع عملات السوق والذهب المباشر",
    currenciesTitle: "العملات الأجنبية",
    goldTitle: "الذهب النفيس",
    updatedAt: "آخر مزامنة",
    loading: "جاري جلب أسعار السوق المباشرة...",
    error: "تعذر الاتصال بخادم السوق. حاول مرة أخرى قريبا.",
    noData: "لا توجد أسعار مسجلة حتى الآن.",
    currencies: { USD: "الدولار الأمريكي", EUR: "اليورو", GBP: "الجنيه الإسترليني", TRY: "الليرة التركية", CNY: "اليوان الصيني" },
    gold: { GOLD_22: "ذهب عيار 22", GOLD_21: "ذهب عيار 21", GOLD_18: "ذهب عيار 18" },
  },
  ku: {
    title: "نرخەکانی بازاڕی هەولێر",
    subtitle: "چاودێریکردنی ڕاستەقینەی دراو و زێڕ",
    currenciesTitle: "دراوە بیانییەکان",
    goldTitle: "زێڕی تاقیکراو",
    updatedAt: "دوایین نوێکردنەوە",
    loading: "هێنانی نرخەکانی بازاڕ...",
    error: "نەتوانرا پەیوەندی بە ڕاژەکارەوە بکرێت. تکایە دووبارە هەوڵ بدەرەوە.",
    noData: "هیچ نرخێک تۆمار نەکراوە تا ئێستا.",
    currencies: { USD: "١٠٠ دۆلاری ئەمەریکی", EUR: "١٠٠ یۆرۆ", GBP: "١٠٠ پاوەندی بەریتانی", TRY: "١٠٠ لیرەی تورکی", CNY: "١٠٠ یوانی چینی" },
    gold: { GOLD_22: "زێڕی عەیار ٢٢", GOLD_21: "زێڕی عەیار ٢١", GOLD_18: "زێڕی عەیار ١٨" },
  },
};

export default function Home() {
  const [data, setData] = useState<CurrencyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>("ku");
  const [theme, setTheme] = useState<Theme>("dark");

  const t = translations[lang];
  const isRtl = lang === "ar" || lang === "ku";

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/currency");
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(t.error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-300 ${theme === "dark" ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium opacity-75">{t.loading}</p>
      </div>
    );
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className={`min-h-screen transition-colors duration-300 ${theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}>
      
      {/* Top Navigation Bar */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${theme === "dark" ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-bold text-xl">
              ⚡
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">{t.title}</h1>
              <p className="text-xs opacity-60 hidden sm:block">{t.subtitle}</p>
            </div>
          </div>

          {/* Controls: Language Switcher & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Language Selection */}
            <div className={`flex p-1 rounded-xl border transition-colors ${theme === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-200 border-slate-300"}`}>
              {(["ku", "ar", "en"] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    lang === l
                      ? "bg-amber-500 text-slate-950 shadow-md scale-105"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {l === "ku" ? "کوردی" : l === "ar" ? "عربي" : "EN"}
                </button>
              ))}
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`p-2.5 rounded-xl border transition-all ${theme === "dark" ? "bg-slate-950 border-slate-800 text-amber-400 hover:bg-slate-800" : "bg-slate-200 border-slate-300 text-amber-600 hover:bg-slate-300"}`}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        
        {error ? (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-center font-medium">
            {error}
          </div>
        ) : !data ? (
          <div className="text-center py-20 opacity-50">{t.noData}</div>
        ) : (
          <>
            {/* Currencies Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  {t.currenciesTitle}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
                {[
                  { key: "USD", val: data.USD, flag: "🇺🇸" },
                  { key: "EUR", val: data.EUR, flag: "🇪🇺" },
                  { key: "GBP", val: data.GBP, flag: "🇬🇧" },
                  { key: "TRY", val: data.TRY, flag: "🇹🇷" },
                  { key: "CNY", val: data.CNY, flag: "🇨🇳" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className={`group relative p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 shadow-xl ${
                      theme === "dark"
                        ? "bg-slate-900/60 border-slate-800/80 hover:border-amber-500/50 shadow-slate-950/50"
                        : "bg-white border-slate-200 hover:border-amber-500/50 shadow-slate-200/50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-2xl">{item.flag}</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${theme === "dark" ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}>
                        {item.key}
                      </span>
                    </div>
                    <div className="text-xs font-medium opacity-60 uppercase tracking-wider mb-1">
                      {t.currencies[item.key as keyof typeof t.currencies]}
                    </div>
                    <div className="text-xl sm:text-2xl font-extrabold tracking-tight">
                      {item.val || "0 IQD"}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Gold Prices Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  {t.goldTitle}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {[
                  { key: "GOLD_22", val: data.GOLD_22 },
                  { key: "GOLD_21", val: data.GOLD_21 },
                  { key: "GOLD_18", val: data.GOLD_18 },
                ].map((item) => (
                  <div
                    key={item.key}
                    className={`relative p-6 sm:p-8 rounded-3xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-xl ${
                      theme === "dark"
                        ? "bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border-amber-500/20 hover:border-amber-500/50 shadow-amber-950/20"
                        : "bg-gradient-to-br from-white via-white to-amber-50 border-amber-500/30 hover:border-amber-500 shadow-amber-100/50"
                    }`}
                  >
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl">🪙</span>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-500">
                        {item.key.replace("GOLD_", "")}K
                      </span>
                    </div>

                    <div className="text-xs font-semibold opacity-60 uppercase tracking-wider mb-1">
                      {t.gold[item.key as keyof typeof t.gold]}
                    </div>
                    
                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-amber-500">
                      {item.val || "N/A"}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Sync Timestamp Footer */}
            <div className={`flex flex-col sm:flex-row items-center justify-between text-xs opacity-60 pt-8 border-t ${theme === "dark" ? "border-slate-900" : "border-slate-200"}`}>
              <p>{t.updatedAt}: {data.createdAt ? new Date(data.createdAt).toLocaleString() : "Just now"}</p>
              <p className="mt-2 sm:mt-0 font-medium">Erbil Borsa</p>
            </div>
          </>
        )}

      </main>
    </div>
  );
}