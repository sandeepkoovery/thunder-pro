import React from 'react';
import { Link } from '@inertiajs/react';

export default function Pagination({ links }) {
    if (links.length <= 3) return null;

    return (
        <div className="flex flex-wrap items-center justify-center gap-1 py-4">
            {links.map((link, key) => (
                link.url === null ? (
                    <div
                        key={key}
                        className="px-4 py-2 text-sm text-gray-400 bg-white border border-gray-200 rounded-lg cursor-default opacity-50"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <Link
                        key={key}
                        href={link.url}
                        className={`px-4 py-2 text-sm rounded-lg border transition-all duration-200 ${link.active
                                ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-md shadow-blue-100 hover:bg-blue-700'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600 shadow-sm'
                            }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                )
            ))}
        </div>
    );
}
