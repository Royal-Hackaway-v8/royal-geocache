const createPledgeTransaction = async (emailToUse: string) => {
	const data = {
		reference: "CacheGrab-" + emailToUse,
		recipient: { email: emailToUse },
		pledges: [
			{
				// plant 1 mangrove tree in Africa
				impact: {
					offeringId: "io_01J4RSBX6KPQ4RYCRZ8C4QWRHF",
					amount: 1,
				},
			},
		],
	};

	try {
		const token = process.env.NEXT_PUBLIC_VERDN_TOKEN;
		if (!token) {
			throw new Error("Missing Verdn token environment variable");
		}

		const response = await fetch(
			"https://api.verdn.com/v2/pledge-transaction",
			{
				method: "POST",
				headers: {
					"Authorization": `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			}
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		console.log("Transaction created:", result);
	} catch (error) {
		console.error("Error creating transaction:", error);
	}
};
