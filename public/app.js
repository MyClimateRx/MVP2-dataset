// Function to join Census Tracts with CVI data
function joinCensusWithCVI(censusTracts, cviData) {
	const cviLookup = new Map(
		cviData.features.map((feature) => [
			`0${feature.properties.fips_code}`,
			feature.properties,
		])
	);

	return {
		type: "FeatureCollection",
		features: censusTracts.features
			.map((tract) => {
				const cviProperties = cviLookup.get(tract.properties.GEOID);
				if (cviProperties) {
					return {
						type: "Feature",
						geometry: tract.geometry,
						properties: {
							tractId: tract.properties.GEOID,
							tractName: tract.properties.NAME,
							maxTemp35c:
								cviProperties.days_with_maximum_temperature_above_35_c,
							maxTemp40c: cviProperties.days_with_maximum_temperature_above_40c,
						},
					};
				}
				return null;
			})
			.filter(Boolean),
	};
}

const map = new maplibregl.Map({
	container: "map",
	style:
		"https://api.maptiler.com/maps/streets/style.json?key=R5Js2wLegZ6GMYd5iN2E",
	center: [-118.2437, 34.0522], // Los Angeles
	zoom: 9,
});

map.on("load", async () => {
	try {
		// Load all data
		const [censusResponse, cviResponse, zipResponse] = await Promise.all([
			fetch("/geoJsons/la_census_tracts.geojson"),
			fetch("/geoJsons/cvi.geojson"),
			fetch("/geoJsons/LA_County_ZIP_Codes.geojson"),
		]);

		const censusTracts = await censusResponse.json();
		const cviData = await cviResponse.json();
		const zipData = await zipResponse.json();

		// Join the census and CVI data
		const joinedData = joinCensusWithCVI(censusTracts, cviData);

		// Add sources
		map.addSource("temperature-data", {
			type: "geojson",
			data: joinedData,
		});

		map.addSource("zip-codes", {
			type: "geojson",
			data: zipData,
		});

		// Add zip code layer first (so it's underneath)
		map.addLayer({
			id: "zip-codes-line",
			type: "line",
			source: "zip-codes",
			paint: {
				"line-color": "#000",
				"line-width": 1,
				"line-opacity": 0.3,
			},
		});

		// Add layers for both temperature metrics (35°C initially visible, 40°C hidden)
		map.addLayer({
			id: "temp-35c",
			type: "fill",
			source: "temperature-data",
			paint: {
				"fill-color": [
					"interpolate",
					["linear"],
					["get", "maxTemp35c"],
					0,
					"#fff5f0",
					0.1,
					"#fee0d2",
					0.2,
					"#fcbba1",
					0.3,
					"#fc9272",
					0.4,
					"#fb6a4a",
					0.5,
					"#ef3b2c",
					0.6,
					"#dc2626",
					0.7,
					"#cb181d",
					0.8,
					"#a50f15",
					1.0,
					"#67000d",
				],
				"fill-opacity": 0.7,
			},
		});

		map.addLayer({
			id: "temp-40c",
			type: "fill",
			source: "temperature-data",
			paint: {
				"fill-color": [
					"interpolate",
					["linear"],
					["get", "maxTemp40c"],
					0,
					"#fff5f0",
					0.1,
					"#fee0d2",
					0.2,
					"#fcbba1",
					0.3,
					"#fc9272",
					0.4,
					"#fb6a4a",
					0.5,
					"#ef3b2c",
					0.6,
					"#dc2626",
					0.7,
					"#cb181d",
					0.8,
					"#a50f15",
					1.0,
					"#67000d",
				],
				"fill-opacity": 0.7,
			},
			layout: {
				visibility: "none",
			},
		});

		// Add layer controls
		const layerControls = document.createElement("div");
		layerControls.style.position = "absolute";
		layerControls.style.top = "10px";
		layerControls.style.right = "10px";
		layerControls.style.padding = "10px";
		layerControls.style.backgroundColor = "white";
		layerControls.style.borderRadius = "4px";
		layerControls.style.boxShadow = "0 0 10px rgba(0,0,0,0.1)";

		// Create radio buttons for layer selection
		const layers = [
			{ id: "temp-35c", label: "Days Above 35°C" },
			{ id: "temp-40c", label: "Days Above 40°C" },
		];

		layers.forEach((layer, i) => {
			const container = document.createElement("div");
			container.style.marginBottom = "5px";

			const radio = document.createElement("input");
			radio.type = "radio";
			radio.name = "temperature-layer";
			radio.id = layer.id;
			radio.checked = i === 0;

			const label = document.createElement("label");
			label.htmlFor = layer.id;
			label.textContent = layer.label;
			label.style.marginLeft = "5px";

			radio.addEventListener("change", () => {
				layers.forEach((l) => {
					map.setLayoutProperty(
						l.id,
						"visibility",
						l.id === layer.id ? "visible" : "none"
					);
				});
			});

			container.appendChild(radio);
			container.appendChild(label);
			layerControls.appendChild(container);
		});

		document.body.appendChild(layerControls);

		// Add popup on hover
		const popup = new maplibregl.Popup({
			closeButton: false,
			closeOnClick: false,
		});

		function showPopup(e, layerId) {
			if (e.features.length > 0) {
				const feature = e.features[0];
				const zipFeatures = map.queryRenderedFeatures(e.point, {
					layers: ["zip-codes-line"],
				});
				let zipCode = "";
				if (zipFeatures.length > 0) {
					zipCode = `<br>ZIP Code: ${zipFeatures[0].properties.ZIPCODE}`;
				}

				popup
					.setLngLat(e.lngLat)
					.setHTML(
						`
                        <strong>Census Tract ${
													feature.properties.tractName
												}</strong>${zipCode}<br>
                        Days Above 35°C: ${feature.properties.maxTemp35c.toFixed(
													2
												)}<br>
                        Days Above 40°C: ${feature.properties.maxTemp40c.toFixed(
													2
												)}
                    `
					)
					.addTo(map);
			}
		}

		map.on("mousemove", "temp-35c", (e) => showPopup(e, "temp-35c"));
		map.on("mousemove", "temp-40c", (e) => showPopup(e, "temp-40c"));

		map.on("mouseleave", "temp-35c", () => popup.remove());
		map.on("mouseleave", "temp-40c", () => popup.remove());
	} catch (error) {
		console.error("Error loading or processing data:", error);
	}
});

// Add navigation controls
map.addControl(new maplibregl.NavigationControl());

// Add scale bar
map.addControl(
	new maplibregl.ScaleControl({
		maxWidth: 80,
		unit: "imperial",
	})
);
