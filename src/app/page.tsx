import TodoList from "@/components/TodoList";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <main className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">
          TODO リスト
        </h1>
        <TodoList />
      </main>
    </div>
  );
}
