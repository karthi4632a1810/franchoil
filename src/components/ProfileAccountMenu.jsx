import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

function ProfileAvatar({ user, myProfile, className = "" }) {
  const initial =
    myProfile?.email?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "F";

  return (
    <span
      className={`profile-wrapper bg-p-c flex justify-center items-center text-c-l poppins rounded-full w-[40px] h-[40px] overflow-hidden shrink-0 ${className}`}
    >
      {myProfile?.photoURL ? (
        <img
          src={myProfile.photoURL}
          alt=""
          className="h-full w-full object-cover rounded-full"
        />
      ) : (
        <span className="text-xl font-semibold">{initial}</span>
      )}
    </span>
  );
}

export default function ProfileAccountMenu({
  isCustomerLoggedIn,
  user,
  myProfile,
  onSignOut,
  className = "",
  dropUp = false,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="border-0 bg-transparent p-0 cursor-pointer flex flex-col items-center gap-0"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <ProfileAvatar user={user} myProfile={myProfile} />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute xl:right-0  z-[200] min-w-[180px] rounded-lg bg-white py-2 shadow-lg border border-slate-200 poppins text-[13px] ${
            dropUp ? "bottom-[calc(100%+10px)]" : "top-[calc(100%+8px)]"
          }`}
        >
          {isCustomerLoggedIn ? (
            <>
              <Link
                role="menuitem"
                to="/dashboard"
                onClick={close}
                className="block px-4 py-2.5 text-slate-800 hover:bg-green-50 hover:text-green-800"
              >
                Dashboard
              </Link>
              <Link
                role="menuitem"
                to="/my-orders"
                onClick={close}
                className="block px-4 py-2.5 text-slate-800 hover:bg-green-50 hover:text-green-800"
              >
                My Orders
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  onSignOut?.();
                }}
                className="w-full text-left px-4 py-2.5 text-slate-800 hover:bg-green-50 hover:text-green-800 border-0 bg-transparent cursor-pointer"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              role="menuitem"
              to="/login"
              onClick={close}
              className="block px-4 py-2.5 text-slate-800 hover:bg-green-50 hover:text-green-800 font-medium"
            >
              Login
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
