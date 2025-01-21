export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  return (
    <div className="flex flex-col gap-2 w-full text-sm mt-4">
      {"success" in message && (
        <div className="bg-green-100 text-green-800 rounded-md px-4 py-3 text-center">
          {message.success}
        </div>
      )}
      {"error" in message && (
        <div className="bg-red-100 text-red-800 rounded-md px-4 py-3 text-center">
          {message.error}
        </div>
      )}
      {"message" in message && (
        <div className="bg-gray-100 text-gray-800 rounded-md px-4 py-3 text-center">
          {message.message}
        </div>
      )}
    </div>
  );
}
