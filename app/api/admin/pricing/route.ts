import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const DEFAULT_PRICING = {
  monthlyPrice: 4900,
  quarterlyPrice: 12900,
  yearlyPrice: 39900,
  currency: "FCFA",
  freeQuotas: 3,
  paidQuotas: 30,
};

export async function GET() {
  try {
    const docRef = doc(db, "settings", "pricing");
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      return NextResponse.json({
        success: true,
        pricing: {
          monthlyPrice: data.monthlyPrice ?? DEFAULT_PRICING.monthlyPrice,
          quarterlyPrice: data.quarterlyPrice ?? DEFAULT_PRICING.quarterlyPrice,
          yearlyPrice: data.yearlyPrice ?? DEFAULT_PRICING.yearlyPrice,
          currency: data.currency || "FCFA",
          freeQuotas: data.freeQuotas ?? DEFAULT_PRICING.freeQuotas,
          paidQuotas: data.paidQuotas ?? DEFAULT_PRICING.paidQuotas,
          updatedAt: data.updatedAt || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      pricing: DEFAULT_PRICING,
    });
  } catch (error: any) {
    console.error("Error fetching pricing from Firestore:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { monthlyPrice, quarterlyPrice, yearlyPrice, currency, freeQuotas, paidQuotas } = body;

    const parsePrice = (val: any, fallback: number) => {
      if (typeof val === "number") return val;
      if (typeof val === "string") {
        const clean = val.replace(/\s+/g, "").replace(/FCFA/gi, "").replace(/XOF/gi, "").trim();
        const num = parseInt(clean, 10);
        return isNaN(num) ? fallback : num;
      }
      return fallback;
    };

    const updatedPricing = {
      monthlyPrice: parsePrice(monthlyPrice, 4900),
      quarterlyPrice: parsePrice(quarterlyPrice, 12900),
      yearlyPrice: parsePrice(yearlyPrice, 39900),
      currency: currency || "FCFA",
      freeQuotas: Number(freeQuotas) || 3,
      paidQuotas: Number(paidQuotas) || 30,
      updatedAt: serverTimestamp(),
      updated_at: new Date().toISOString(),
    };

    const docRef = doc(db, "settings", "pricing");
    await setDoc(docRef, updatedPricing, { merge: true });

    console.log("[Firestore Sync] Tarifs mis à jour avec succès dans settings/pricing:", updatedPricing);

    return NextResponse.json({
      success: true,
      pricing: updatedPricing,
      message: "Tarification synchronisée avec succès dans Firebase Firestore.",
    });
  } catch (error: any) {
    console.error("Error updating pricing in Firestore:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
