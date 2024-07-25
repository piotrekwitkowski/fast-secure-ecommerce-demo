
import Layout from './components/Layout';

export default function Sales({ }) {
    return (
        <Layout>
            <div className="container mx-auto p-4 bg-gray-100 min-h-screen">
                <main className="flex flex-col items-center space-y-6">
                    <h1 className="text-3xl font-bold text-green-600 mb-4">50% discount this week</h1>
                    <div className="rounded-lg overflow-hidden shadow-lg">
                        <video
                            autoPlay
                            loop
                            playsInline
                            className="max-w-full"
                        >
                            <source src="/sales.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </main>
            </div>
        </Layout>
    );
}