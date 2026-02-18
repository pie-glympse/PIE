import GcardSkeleton from "@/components/GcardSkeleton";

export default function HomeLoading() {
  return (
    <main className="overflow-y-auto md:overflow-hidden pt-24 p-10 flex flex-col gap-8">
      <section className="mt-10">
        <div className="h-10 w-48 rounded bg-gray-200 animate-pulse" />
        <div className="h-12 w-64 mt-2 rounded bg-gray-100 animate-pulse" />
      </section>

      <section>
        <div className="h-6 w-32 mb-4 rounded bg-gray-200 animate-pulse" />
        <div className="h-[280px] rounded-lg bg-gray-100 animate-pulse" />
      </section>

      <section className="flex flex-col">
        <div className="h-7 w-48 mb-4 rounded bg-gray-200 animate-pulse" />
        <div className="flex flex-col md:flex-row gap-4 md:overflow-x-auto md:pb-2">
          <GcardSkeleton className="w-full md:w-100 h-60 md:flex-shrink-0" />
          <GcardSkeleton className="w-full md:w-100 h-60 md:flex-shrink-0" />
          <GcardSkeleton className="w-full md:w-100 h-60 md:flex-shrink-0" />
          <div className="w-full md:w-20 h-60 md:flex-shrink-0 rounded-xl bg-gray-100 animate-pulse" />
        </div>
        <div className="h-5 w-20 mt-4 ml-auto rounded bg-gray-100 animate-pulse" />
      </section>
    </main>
  );
}
