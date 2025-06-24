import { CircleLoader } from "react-spinners";

export default function Loading() {
    return (
        <main className="w-full h-[calc(100vh-3.5rem)] flex flex-col justify-center items-center mb-6">
            <CircleLoader size={50} color="var(--primary)" />
        </main>
    );
}
