export function ConfigError(props: { title: string; message: string }) {
  return (
    <main className="mx-auto w-full max-w-[680px] px-5 pb-16 pt-16 text-stone-800">
      <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
        AI Daily Briefing
      </p>
      <h1 className="mt-3 text-4xl font-normal leading-tight">{props.title}</h1>
      <p className="mt-5 font-sans text-[16px] leading-7 text-stone-700 whitespace-pre-wrap">
        {props.message}
      </p>
    </main>
  );
}
