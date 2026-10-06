import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const empty = { label:"HOME", addressLine:"", city:"Delhi", state:"Delhi", pincode:"", landmark:"", latitude:null, longitude:null, isDefault:false };

export default function Profile({ navigate }) {
  const { user, setUser } = useAuth();
  const [name,setName]=useState(user?.name||"");
  const [email,setEmail]=useState(user?.email||"");
  const [addresses,setAddresses]=useState([]);
  const [address,setAddress]=useState(empty);
  const [message,setMessage]=useState("");

  useEffect(()=>{ if(user?.addresses) setAddresses(user.addresses); },[user]);

  const saveProfile=async()=>{
    try{const d=await api("/users/profile",{method:"PATCH",body:JSON.stringify({name,email})});setUser(d.user);setMessage("Profile updated.");}catch(e){setMessage(e.message);}
  };
  const useLocation=()=>{
    if(!navigator.geolocation) return setMessage("Location is not supported by this browser.");
    navigator.geolocation.getCurrentPosition(
      p=>setAddress(a=>({...a,latitude:p.coords.latitude,longitude:p.coords.longitude})),
      ()=>setMessage("Location permission was denied.")
    );
  };
  const addAddress=async()=>{
    try{const d=await api("/users/addresses",{method:"POST",body:JSON.stringify(address)});setAddresses(d.addresses);setAddress(empty);setMessage("Address saved.");}
    catch(e){setMessage(e.message);}
  };

  return <div className="mx-auto max-w-5xl px-5 py-12">
    <div className="flex items-center justify-between"><div><p className="text-xs font-bold tracking-[.18em] text-[#c62828]">ACCOUNT</p><h1 className="mt-2 text-3xl font-black">Your profile</h1></div><button onClick={()=>navigate("/orders")} className="rounded-full border px-5 py-2.5 text-sm font-bold">My orders</button></div>
    {message&&<div className="mt-5 rounded-2xl bg-black/5 p-3 text-sm">{message}</div>}
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <section className="rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Basic details</h2>
        <label className="mt-5 block text-sm font-bold">Name</label><input value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3"/>
        <label className="mt-4 block text-sm font-bold">Email</label><input value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-2xl border px-4 py-3"/>
        <label className="mt-4 block text-sm font-bold">Phone</label><input value={user?.phone||""} disabled className="mt-2 w-full rounded-2xl border bg-black/5 px-4 py-3"/>
        <button onClick={saveProfile} className="mt-5 rounded-2xl bg-[#171717] px-6 py-3 font-bold text-white">Save profile</button>
      </section>
      <section className="rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Saved addresses</h2>
        <div className="mt-4 space-y-3">{addresses.map(a=><div key={a._id} className="rounded-2xl border p-4"><div className="flex justify-between"><b>{a.label}</b>{a.isDefault&&<span className="text-xs text-[#c62828]">Default</span>}</div><p className="mt-1 text-sm text-black/60">{a.addressLine}, {a.city}, {a.state} - {a.pincode}</p></div>)}</div>
        <div className="mt-5 border-t pt-5"><div className="flex items-center justify-between"><h3 className="font-black">Add address</h3><button onClick={useLocation} className="text-sm font-bold text-[#c62828]">Use my location</button></div>
          <input value={address.addressLine} onChange={e=>setAddress({...address,addressLine:e.target.value})} placeholder="House / street / area" className="mt-3 w-full rounded-2xl border px-4 py-3"/>
          <div className="mt-3 grid grid-cols-2 gap-3"><input value={address.city} onChange={e=>setAddress({...address,city:e.target.value})} placeholder="City" className="rounded-2xl border px-4 py-3"/><input value={address.pincode} onChange={e=>setAddress({...address,pincode:e.target.value})} placeholder="Pincode" className="rounded-2xl border px-4 py-3"/></div>
          <input value={address.landmark} onChange={e=>setAddress({...address,landmark:e.target.value})} placeholder="Landmark (optional)" className="mt-3 w-full rounded-2xl border px-4 py-3"/>
          {address.latitude&&<p className="mt-2 text-xs text-green-600">Location captured: {address.latitude.toFixed(5)}, {address.longitude.toFixed(5)}</p>}
          <button onClick={addAddress} className="mt-4 rounded-2xl bg-[#c62828] px-6 py-3 font-bold text-white">Save address</button>
        </div>
      </section>
    </div>
  </div>;
}
