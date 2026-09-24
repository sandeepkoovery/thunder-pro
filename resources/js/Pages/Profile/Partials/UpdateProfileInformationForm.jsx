import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import DatePicker from '@/Components/DatePicker';
import { User as UserIcon, Mail, Briefcase, Phone, Camera, CheckCircle, Building2, MapPin, Hash, ShieldCheck } from 'lucide-react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
    isCompanyAdmin = false,
    companyDetails = null,
}) {
    const { auth } = usePage().props;
    const user = auth.user;
    const isCompany = isCompanyAdmin || ['admin', 'superadmin'].includes(user?.role);

    const getLocalYMD = (dateStr) => {
        if (!dateStr) return '';
        if (dateStr.includes('T')) {
            const dateObj = new Date(dateStr);
            if (isNaN(dateObj.getTime())) return '';
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        return dateStr.substring(0, 10);
    };

    const { data, setData, post, errors, processing, recentlySuccessful } =
        useForm({
            // Company fields
            company_name: user?.company_name || companyDetails?.company_name || '',
            gst_no: user?.gst_no || companyDetails?.gst_no || '',
            name: user?.name || companyDetails?.name || '',

            // Employee fields
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            gender: user?.gender || '',
            date_of_birth: getLocalYMD(user?.date_of_birth),
            blood_group: user?.blood_group || '',
            emergency_contact_name: user?.emergency_contact_name || '',
            emergency_contact_number: user?.emergency_contact_number || '',

            // Common fields
            mobile: user?.mobile || user?.phone || companyDetails?.phone || '',
            email: user?.email || companyDetails?.email || '',
            address: user?.address || companyDetails?.address || '',
            thumb: null,
            _method: 'patch',
        });

    const submit = (e) => {
        e.preventDefault();
        post(route('profile.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <section className={className}>
            <form onSubmit={submit} className="space-y-10">
                {/* Avatar / Logo Section */}
                <div className="flex flex-col sm:flex-row items-center gap-8 pb-8 border-b border-gray-100">
                    <div className="relative group">
                        <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gray-50 border-4 border-white shadow-md ring-1 ring-gray-100 transition-all duration-500 group-hover:scale-105 flex items-center justify-center">
                            <img
                                src={user?.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(isCompany ? (data.company_name || user?.name || 'Company') : (user?.name || 'User'))}&background=f3f4f6&color=444&size=200`}
                                alt={isCompany ? "Company Logo" : "Profile Photo"}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <label
                            htmlFor="thumb"
                            className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#0099ff] hover:bg-[#0088ee] rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg transition-all active:scale-95 border-4 border-white"
                            title={isCompany ? "Upload Company Logo" : "Upload Profile Photo"}
                        >
                            <Camera className="w-4 h-4 text-white" />
                        </label>
                        <input
                            id="thumb"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setData('thumb', e.target.files[0])}
                        />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1">
                            {isCompany ? 'Company Logo / Branding' : 'Profile Photo'}
                        </h4>
                        <p className="text-xs text-gray-400 font-medium mb-3">
                            {isCompany 
                                ? 'Upload official company logo. PNG or JPG. Max 2MB.' 
                                : 'PNG, JPG or High-Res GIF. Max 2MB.'}
                        </p>
                        {data.thumb && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-[#0099ff] rounded-full text-[10px] font-bold border border-blue-100 uppercase tracking-widest animate-pulse">
                                <CheckCircle className="w-3.5 h-3.5" />
                                {isCompany ? 'Logo Selected' : 'Image Selected'}
                            </div>
                        )}
                        {errors.thumb && (
                            <p className="text-red-500 text-[10px] font-bold uppercase mt-2">{errors.thumb}</p>
                        )}
                    </div>
                </div>

                {isCompany ? (
                    /* COMPANY PROFILE EDIT FORM */
                    <div className="space-y-8">
                        {/* Company Details Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                                <Building2 className="w-4 h-4 text-[#0099ff]" />
                                <h3 className="text-sm font-bold text-gray-800">Company & Business Information</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                {/* Company Name */}
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                                        Company Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="company_name"
                                        value={data.company_name}
                                        onChange={(e) => setData('company_name', e.target.value)}
                                        required
                                        className={`w-full bg-white border border-gray-300 shadow-2xs rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-blue-50 focus:border-[#0099ff] transition-all placeholder:text-gray-400 outline-none ${errors.company_name ? "border-red-400 ring-red-50" : ""}`}
                                        placeholder="Enter official Company Name"
                                    />
                                    {errors.company_name && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.company_name}</p>}
                                </div>

                                {/* GST No */}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                                        GST Number (GSTIN)
                                    </label>
                                    <input
                                        id="gst_no"
                                        value={data.gst_no}
                                        onChange={(e) => setData('gst_no', e.target.value.toUpperCase())}
                                        className={`w-full bg-white border border-gray-300 shadow-2xs rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 uppercase focus:ring-4 focus:ring-blue-50 focus:border-[#0099ff] transition-all placeholder:text-gray-400 outline-none ${errors.gst_no ? "border-red-400 ring-red-50" : ""}`}
                                        placeholder="e.g. 29AAAAA0000A1Z5"
                                    />
                                    {errors.gst_no && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.gst_no}</p>}
                                </div>

                                {/* Contact Person / Admin Name */}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                                        Authorized Person / Admin Name
                                    </label>
                                    <input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={`w-full bg-white border border-gray-300 shadow-2xs rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-blue-50 focus:border-[#0099ff] transition-all placeholder:text-gray-400 outline-none ${errors.name ? "border-red-400 ring-red-50" : ""}`}
                                        placeholder="Administrator / Contact Person"
                                    />
                                    {errors.name && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.name}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Company Contact Information Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                                <Phone className="w-4 h-4 text-[#0099ff]" />
                                <h3 className="text-sm font-bold text-gray-800">Official Contact & Address</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                {/* Contact No / Mobile */}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                                        Contact Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="mobile"
                                        value={data.mobile}
                                        onChange={(e) => setData('mobile', e.target.value)}
                                        required
                                        className={`w-full bg-white border border-gray-300 shadow-2xs rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-blue-50 focus:border-[#0099ff] transition-all placeholder:text-gray-400 outline-none ${errors.mobile ? "border-red-400 ring-red-50" : ""}`}
                                        placeholder="e.g. +91 98765 43210"
                                    />
                                    {errors.mobile && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.mobile}</p>}
                                </div>

                                {/* Official Mail ID */}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                                        Mail ID (Official Email) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        className={`w-full bg-white border border-gray-300 shadow-2xs rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-blue-50 focus:border-[#0099ff] transition-all placeholder:text-gray-400 outline-none ${errors.email ? "border-red-400 ring-red-50" : ""}`}
                                        placeholder="e.g. admin@company.com"
                                    />
                                    {errors.email && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.email}</p>}
                                </div>

                                {/* Address */}
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                                        Registered Company Address <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="address"
                                        rows="3"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        required
                                        className={`w-full bg-white border border-gray-300 shadow-2xs rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-blue-50 focus:border-[#0099ff] transition-all placeholder:text-gray-400 outline-none resize-none ${errors.address ? "border-red-400 ring-red-50" : ""}`}
                                        placeholder="Complete registered office address, city, state, pincode"
                                    />
                                    {errors.address && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.address}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* REGULAR EMPLOYEE / USER FORM */
                    <div className="space-y-10">
                        {/* Personal Information Section */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3">Personal Information</h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                {/* First Name */}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">First Name</label>
                                    <input
                                        id="first_name"
                                        value={data.first_name}
                                        onChange={(e) => setData('first_name', e.target.value)}
                                        required
                                        className={`w-full bg-white border border-gray-300 shadow-xs rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-indigo-50 focus:border-[#7e89ca] transition-all placeholder:text-gray-400 outline-none ${errors.first_name ? "border-red-400 ring-red-50" : ""}`}
                                        placeholder="First Name"
                                    />
                                    {errors.first_name && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.first_name}</p>}
                                </div>

                                {/* Last Name */}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Last Name</label>
                                    <input
                                        id="last_name"
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                        required
                                        className={`w-full bg-white border border-gray-300 shadow-xs rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-indigo-50 focus:border-[#7e89ca] transition-all placeholder:text-gray-400 outline-none ${errors.last_name ? "border-red-400 ring-red-50" : ""}`}
                                        placeholder="Last Name"
                                    />
                                    {errors.last_name && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.last_name}</p>}
                                </div>

                                {/* Gender */}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Gender</label>
                                    <select
                                        id="gender"
                                        value={data.gender}
                                        onChange={(e) => setData('gender', e.target.value)}
                                        className={`w-full bg-white border border-gray-300 shadow-xs rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-indigo-50 focus:border-[#7e89ca] transition-all outline-none cursor-pointer appearance-none ${errors.gender ? "border-red-400 ring-red-50" : ""}`}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                    {errors.gender && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.gender}</p>}
                                </div>

                                {/* Date of Birth */}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Date of Birth</label>
                                    <DatePicker
                                        value={data.date_of_birth}
                                        onChange={(e) => setData('date_of_birth', e.target ? e.target.value : e)}
                                        required
                                    />
                                    {errors.date_of_birth && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.date_of_birth}</p>}
                                </div>

                                {/* Blood Group */}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Blood Group (Optional)</label>
                                    <input
                                        id="blood_group"
                                        value={data.blood_group}
                                        onChange={(e) => setData('blood_group', e.target.value)}
                                        className={`w-full bg-white border border-gray-300 shadow-xs rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-indigo-50 focus:border-[#7e89ca] transition-all placeholder:text-gray-400 outline-none ${errors.blood_group ? "border-red-400 ring-red-50" : ""}`}
                                        placeholder="E.g. A+, O-, B+"
                                    />
                                    {errors.blood_group && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.blood_group}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Contact Information Section */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3">Contact Information</h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                {/* Mobile Number */}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Mobile Number</label>
                                    <input
                                        id="mobile"
                                        value={data.mobile}
                                        onChange={(e) => setData('mobile', e.target.value)}
                                        required
                                        className={`w-full bg-white border border-gray-300 shadow-xs rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-indigo-50 focus:border-[#7e89ca] transition-all placeholder:text-gray-400 outline-none ${errors.mobile ? "border-red-400 ring-red-50" : ""}`}
                                        placeholder="Mobile Number"
                                    />
                                    {errors.mobile && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.mobile}</p>}
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        className={`w-full bg-white border border-gray-300 shadow-xs rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-indigo-50 focus:border-[#7e89ca] transition-all placeholder:text-gray-400 outline-none ${errors.email ? "border-red-400 ring-red-50" : ""}`}
                                        placeholder="Email Address"
                                    />
                                    {errors.email && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.email}</p>}
                                </div>

                                {/* Address */}
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Address</label>
                                    <textarea
                                        id="address"
                                        rows="3"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        required
                                        className={`w-full bg-white border border-gray-300 shadow-xs rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-indigo-50 focus:border-[#7e89ca] transition-all placeholder:text-gray-400 outline-none resize-none ${errors.address ? "border-red-400 ring-red-50" : ""}`}
                                        placeholder="Current Residential Address"
                                    />
                                    {errors.address && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.address}</p>}
                                </div>

                                {/* Emergency Contact Name */}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Emergency Contact Name (Optional)</label>
                                    <input
                                        id="emergency_contact_name"
                                        value={data.emergency_contact_name}
                                        onChange={(e) => setData('emergency_contact_name', e.target.value)}
                                        className={`w-full bg-white border border-gray-300 shadow-xs rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-indigo-50 focus:border-[#7e89ca] transition-all placeholder:text-gray-400 outline-none ${errors.emergency_contact_name ? "border-red-400 ring-red-50" : ""}`}
                                        placeholder="Contact Name"
                                    />
                                    {errors.emergency_contact_name && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.emergency_contact_name}</p>}
                                </div>

                                {/* Emergency Contact Number */}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Emergency Contact Number (Optional)</label>
                                    <input
                                        id="emergency_contact_number"
                                        value={data.emergency_contact_number}
                                        onChange={(e) => setData('emergency_contact_number', e.target.value)}
                                        className={`w-full bg-white border border-gray-300 shadow-xs rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-indigo-50 focus:border-[#7e89ca] transition-all placeholder:text-gray-400 outline-none ${errors.emergency_contact_number ? "border-red-400 ring-red-50" : ""}`}
                                        placeholder="Contact Number"
                                    />
                                    {errors.emergency_contact_number && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.emergency_contact_number}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Actions */}
                <div className="flex items-center gap-6 pt-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-10 py-3 bg-[#0099ff] hover:bg-[#0088ee] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                        {isCompany ? 'Save Company Details' : 'Save Settings'}
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-out duration-300"
                        enterFrom="opacity-0 translate-x-4"
                        enterTo="opacity-100 translate-x-0"
                        leave="transition ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="flex items-center gap-2 text-emerald-500">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                {isCompany ? 'Company Details Saved' : 'Sync Successful'}
                            </span>
                        </div>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
