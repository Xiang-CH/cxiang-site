import { PacmanLoader } from "react-spinners";

export default function Loading() {
    return (
        <main className="w-full h-full flex flex-col justify-center items-center">
            <PacmanLoader color="#000" size={20} />
        </main>
    );
}
