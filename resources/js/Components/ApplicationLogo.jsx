export default function ApplicationLogo(props) {
    return (
        <div className={`flex items-center gap-2 ${props.className}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Thunder Pro
            </span>
        </div>
    );
}
