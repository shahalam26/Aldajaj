import { useEffect, useState } from "react";
import { api } from "../services/api";
import { openCashfreeCheckout } from "../services/cashfree";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Checkout({ navigate }) {
  const { user, setUser } = useAuth();
  const { items, total, clear } = useCart();
  const [addresses,setAddresses]=useState(user?.addresses||[]);
  const [addressId,setAddressId]=useState((user?.addresses||[]).find(a=>a.isDefault)?._id || user?.addresses?.[0]?._id || "");
  const [paymentMethod,setPaymentMethod]=useState("COD");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  useEffect(()=>setAddresses(user?.addresses||[]),[user]);

  const place=async()=>{
    if(!addressId) return setMessage("Please select a delivery address.");
    if(!items.length) return navigate("/cart");
    try{
      setBusy(true);setMessage("");
      const payload={items:items.map(x=>({product:x.product,quantity:x.quantity})),paymentMethod,addressId};
      const d=await api("/orders",{method:"POST",body:JSON.stringify(payload)});
      if(paymentMethod==="COD"){clear();navigate(`/orders?placed=${d.order?._id||""}`);return;}
      if(!d.payment?.paymentSessionId) throw new Error("Payment session was not created.");
      sessionStorage.setItem("dilli_pending_order",d.order?._id||"");
      await openCashfreeCheckout(d.payment.paymentSessionId);
    }catch(e){setMessage(e.message);}finally{setBusy(false);}
  };

  return <div className="mx-auto max-w-5xl px-5 py-12">
    <h1 className="text-3xl font-black">Checkout</h1>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Delivery address</h2>
        {addresses.length?<div className="mt-4 space-y-3">{addresses.map(a=><label key={a._id} className={`block rounded-2xl border p-4 ${addressId===a._id?"border-[#c62828] bg-[#c62828]/5":"border-black/10"}`}><input type="radio" checked={addressId===a._id} onChange={()=>setAddressId(a._id)} className="mr-3"/><b>{a.label}</b><p className="ml-6 mt-1 text-sm text-black/60">{a.addressLine}, {a.city}, {a.state} - {a.pincode}</p></label>)}</div>
          :<div className="mt-4 rounded-2xl bg-black/5 p-4 text-sm">No address saved. Add one from your profile first.</div>}
        <button onClick={()=>navigate("/profile")} className="mt-4 text-sm font-bold text-[#c62828]">+ Add / manage address</button>
        <h2 className="mt-8 text-xl font-black">Payment</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><button onClick={()=>setPaymentMethod("COD")} className={`rounded-2xl border p-4 text-left ${paymentMethod==="COD"?"border-[#c62828] bg-[#c62828]/5":""}`}><b>Cash on Delivery</b><p className="text-xs text-black/50">Pay when your order arrives</p></button><button onClick={()=>setPaymentMethod("ONLINE")} className={`rounded-2xl border p-4 text-left ${paymentMethod==="ONLINE"?"border-[#c62828] bg-[#c62828]/5":""}`}><b>Online payment</b><p className="text-xs text-black/50">Cashfree secure checkout</p></button></div>
        {message&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
      </section>
      <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Order summary</h2><div className="mt-5 space-y-3">{items.map(x=><div key={x.product} className="flex justify-between text-sm"><span>{x.productData.name} × {x.quantity}</span><span>₹{x.productData.price*x.quantity}</span></div>)}</div><div className="mt-5 border-t pt-5 flex justify-between text-xl font-black"><span>Total</span><span>₹{total}</span></div><button disabled={busy||!addresses.length} onClick={place} className="mt-6 w-full rounded-2xl bg-[#c62828] py-3.5 font-bold text-white disabled:opacity-40">{busy?"Processing...":paymentMethod==="ONLINE"?"Proceed to Pay":"Place COD Order"}</button></aside>
    </div>
  </div>;
}
