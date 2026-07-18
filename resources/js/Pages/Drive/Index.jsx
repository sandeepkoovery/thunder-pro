import React from "react";
import { Head } from "@inertiajs/react";
import UserLayout from "@/Layouts/UserLayout";
import Gallery from "@/Components/Gallery";

export default function DriveIndex() {
    return (
        <div>
            <Head title="Drive" />
            <div className="bg-white p-6 rounded shadow">
                <h2 className="text-xl font-bold mb-4">Drive Gallery</h2>
                <Gallery />
            </div>
        </div>
    );
}

DriveIndex.layout = (page) => <UserLayout title="Drive">{page}</UserLayout>;
