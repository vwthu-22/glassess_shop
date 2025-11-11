"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AccountDetails() {
    const router = useRouter();

    const [user, setUser] = useState({
        id: "",
        name: "",
        address: "",
        phone: "",
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedUser = localStorage.getItem("user");
            console.log("📦 Dữ liệu user trong localStorage:", storedUser);
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    if (!parsedUser.id) {
                        alert("Dữ liệu không hợp lệ, vui lòng đăng nhập lại!");
                        localStorage.removeItem("user");
                        router.push("/log/index.html");
                        return;
                    }

                    setUser({
                        id: parsedUser.id,  // ✅ Đảm bảo ID luôn có giá trị
                        name: parsedUser.name || "",
                        address: parsedUser.address || "",
                        phone: parsedUser.phone || "",
                    });
                } catch (error) {
                    console.error("Lỗi khi parse user:", error);
                    localStorage.removeItem("user");
                    router.push("/log/index.html");
                }
            } else {
                alert("Bạn chưa đăng nhập!");
                router.push("/log/index.html");
            }
        }
    }, []);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUser((prevUser) => ({
            ...prevUser,
            [e.target.name]: e.target.value || "",
        }));
    };
    const handleSave = async () => {
        if (!user.id || isNaN(Number(user.id))) {
            alert("Không xác định được ID người dùng! Vui lòng đăng nhập lại.");
            router.push("/log/index.html");
            return;
        }

        try {
            const id = user.id;
            const response = await fetch(`http://localhost:3000/api/v1/users/${id}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(user),
            });

            if (!response.ok) throw new Error("Cập nhật thất bại!");

            const result = await response.json();

            console.log("📢 Dữ liệu trả về từ API:", result); // Kiểm tra response

            if (!result.message || !localStorage.getItem("user")) {
                throw new Error("Dữ liệu API trả về không hợp lệ!");
            }

            // Lấy dữ liệu cũ từ localStorage
            const storedUser = JSON.parse(localStorage.getItem("user")!);

            // Cập nhật dữ liệu cũ với dữ liệu mới
            const updatedUser = {
                ...storedUser,
                name: user.name || storedUser.name,
                address: user.address || storedUser.address,
                phone: user.phone || storedUser.phone,
            };

            localStorage.setItem("user", JSON.stringify(updatedUser));
            alert("Cập nhật thành công!");
            router.push("/profile");
            router.refresh();
        } catch (error) {
            console.error("❌ Lỗi:", error);
            alert("Có lỗi xảy ra, vui lòng thử lại!");
        }
    };

    return (
        <div className="mx-32 mb-20 mt-10">
            <div className="flex justify-center text-black py-10 rounded-lg bg-red-50 w-full">
                <div className="bg-white rounded-lg shadow p-20">
                    <h2 className="text-3xl font-bold bg-slate-200 p-2 px-3 rounded-lg text-center mb-6">
                        Edit User Form
                    </h2>
                    <div className="space-y-6 my-10 gap-2 grid">
                        <div className="flex justify-between">
                            <label className="font-medium flex items-center">Name:</label>
                            <input
                                type="text"
                                name="name"
                                value={user.name}
                                onChange={handleChange}
                                className="border bg-white px-2 py-1 rounded-md"
                            />
                        </div>
                        <div className="flex justify-between">
                            <label className="font-medium flex items-center">Address:</label>
                            <input
                                type="text"
                                name="address"
                                value={user.address}
                                onChange={handleChange}
                                className="border bg-white px-2 py-1 rounded-md"
                            />
                        </div>
                        <div className="flex justify-between">
                            <label className="font-medium flex items-center">Phone:</label>
                            <input
                                type="text"
                                name="phone"
                                value={user.phone}
                                onChange={handleChange}
                                className="border bg-white px-2 py-1 rounded-md"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <Link href={"/profile"}>
                            <button className="bg-gray-300 px-3 py-1 rounded mr-2">Cancel</button>
                        </Link>
                        <button onClick={handleSave} className="bg-blue-500 text-white px-5 py-1 rounded">
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
