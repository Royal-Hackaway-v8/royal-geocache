export default function PageView({
	title,
	className,
	children,
}: {
	title?: string;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div
			className={
				"w-full h-full flex flex-col justify-start pt-24 " + className
			}
		>
			{title && (
				<h1 className="font-bold text-3xl mx-auto mb-8">{title}</h1>
			)}
			<div className="flex flex-col items-center">{children}</div>
		</div>
	);
}
