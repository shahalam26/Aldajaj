import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useCart } from "../context/CartContext";

export default function PaymentResult({ navigate }) {
  const { clear } = useCart();
  const [message,setMessage]=useState("Confirming your payment...");
  const [done,setDone]=useState(false);
  useEffect(()=>{
    clear();
    let tries=0;
    const id=setInterval(async()=>{
      tries++;
      try{
        const d=await api("/orders/my-orders");
        const localId=sessionStorage.getItem("dilli_pending_order");
        const order=(d.orders||[]).find(o=>o._id===localId);
        if(order?.paymentStatus==="PAID"){setMessage("Payment successful. Your order is confirmed.");setDone(true);sessionStorage.removeItem("dilli_pending_order");clearInterval(id);}
        else if(order?.paymentStatus==="FAILED"){setMessage("Payment failed. Please try again.");setDone(true);clearInterval(id);}
        else if(tries>=10){setMessage("Payment is still being confirmed. Check My Orders in a moment.");setDone(true);clearInterval(id);}
      }catch{}
    },1500);
    return()=>clearInterval(id);
  },[]);
  return <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-5 py-16"><div className="w-full rounded-3xl bg-white p-10 text-center shadow-xl"><div className="text-6xl">{done?"✓":"…"}</div><h1 className="mt-5 text-2xl font-black">{message}</h1><button onClick={()=>navigate("/orders")} className="mt-7 rounded-full bg-[#171717] px-7 py-3 font-bold text-white">View orders</button></div></div>;
}
