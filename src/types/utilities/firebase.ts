export namespace FirebaseSpace {
	export interface ScreenViewParams {
		screen_name: string;
		screen_class: string;
	}

	export interface ExampleEventParams {
		item_id: string;
		item_name: string;
		item_category: string;
	}

	export type AnalyticsEventParams = ScreenViewParams | ExampleEventParams;

	export type AnalyticsEvent = {
		screen_view: ScreenViewParams;
		example_event: ExampleEventParams;
	};

	export type EventNames = keyof AnalyticsEvent;
}
