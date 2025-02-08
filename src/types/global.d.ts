declare namespace JSX {
	interface IntrinsicElements {
		"model-viewer": React.DetailedHTMLProps<
			React.HTMLAttributes<HTMLElement>,
			HTMLElement
		> & {
			src?: string;
			iosSrc?: string;
			alt?: string;
			ar?: boolean;
			"ar-modes"?: string;
			"camera-controls"?: boolean;
			"auto-rotate"?: boolean;
			"environment-image"?: string;
			"shadow-intensity"?: string;
		};
	}
}
