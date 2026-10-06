import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Orders() {
  const [orders,setOrders]=useState([]); const [loading,setLoading]=useState(true);
  const load=()=>api("/orders/my-orders").then(d=>setOrders(d.orders||[])).catch(console.error).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);
  return <div className="mx-auto max-w-5xl px-5 py-12"><h1 className="text-3xl font-black">My orders</h1>
    <button onClick={load} className="mt-3 text-sm font-bold text-[#c62828]">Refresh</button>
    {loading?<p className="mt-10 text-black/50">Loading orders...</p>:!orders.length?<div className="mt-10 rounded-3xl bg-white p-10 text-center text-black/50">No orders yet.</div>:
    <div className="mt-7 space-y-4">{orders.map(o=><article key={o._id} className="rounded-3xl bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-black/40">{new Date(o.createdAt).toLocaleString()}</p><h3 className="mt-1 font-black">Order #{o._id.slice(-8).toUpperCase()}</h3></div><div className="flex gap-2"><span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold">{o.status}</span><span className="rounded-full bg-[#c62828]/10 px-3 py-1 text-xs font-bold text-[#c62828]">{o.paymentStatus}</span></div></div><div className="mt-4 space-y-2">{o.items?.map((i,idx)=><div key={idx} className="flex justify-between text-sm"><span>{i.product?.name||"Product"} × {i.quantity}</span><b>₹{i.price*i.quantity}</b></div>)}</div><div className="mt-4 flex justify-between border-t pt-4 font-black"><span>Total</span><span>₹{o.totalAmount}</span></div></article>)}</div>}
  </div>;
}
