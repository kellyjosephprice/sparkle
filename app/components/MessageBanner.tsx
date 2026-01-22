interface MessageBannerProps {
  message: string;
}

export default function MessageBanner({ message }: MessageBannerProps) {
  return (
    <div className="border-l-4 border-white bg-gray-900 p-3 mb-6 text-sm text-white">
      {message}
    </div>
  );
}
