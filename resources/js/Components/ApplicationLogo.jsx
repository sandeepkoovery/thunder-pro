const getAssetUrl = (path) => {
    try {
        const base = route('/');
        const baseSlash = base.endsWith('/') ? base : base + '/';
        return baseSlash + (path.startsWith('/') ? path.substring(1) : path);
    } catch (e) {
        return path;
    }
};

export default function ApplicationLogo(props) {
    return (
        <div className={`flex items-center gap-2 ${props.className}`}>
            <img src={getAssetUrl('images/worknest_logo.png?v=3')} alt="WorkNest Logo" className="w-12 h-12 rounded-lg object-contain" />
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                WorkNest
            </span>
        </div>
    );
}
