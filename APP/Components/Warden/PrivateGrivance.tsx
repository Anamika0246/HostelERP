import {
	StyleSheet,
	Text,
	View,
	FlatList,
	ActivityIndicator,
	TouchableOpacity,
	Modal,
	TouchableWithoutFeedback,
} from "react-native";
import React, { useEffect, useState } from "react";
import useStore from "../../Store/Store";
import { RefreshControl } from "react-native-gesture-handler";

const PrivateGrievances = () => {
	const { localhost, cookie } = useStore();
	const [grievances, setGrievances] = useState([]);
	const [filtered, setFiltered] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedGrievance, setSelectedGrievance] = useState(null);
	const [selectedHostler, setSelectedHostler] = useState(null);
	const [updating, setUpdating] = useState(false);
	const [filterStatus, setFilterStatus] = useState("All"); // State for filter
	const [refreshing, setRefreshing] = useState(false); // State for refresh control

	// Fetch grievances with optional status filter
	const fetchGrievances = async () => {
		try {
			// setLoading(true);
			const response = await fetch(
				`${localhost}/api/warden/getprivategrievance`,
				{
					headers: { Cookie: cookie },
				}
			);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Unable to fetch grievances");
			}

			setGrievances(data);
		} catch (error) {
			console.error("Error fetching grievances:", error);
		} finally {
			setLoading(false);
		}
	};

	// Fetch selected hostler details
	const fetchHostlerDetails = async (studentId) => {
		try {
			const response = await fetch(
				`${localhost}/api/warden/getdetail/${studentId}`,
				{
					headers: { Cookie: cookie },
				}
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(
					data.message || "Unable to fetch hosteller data"
				);
			}
			setSelectedHostler(data);
		} catch (error) {
			console.error("Error fetching hosteller details:", error);
		}
	};

	const filterChange = () => {
		if (filterStatus === "Pending") {
			const filtered = grievances.filter(
				(grievance) => grievance.status === "Pending"
			);
			setFiltered(filtered);
		} else if (filterStatus === "Resolved") {
			const filtered = grievances.filter(
				(grievance) => grievance.status === "Resolved"
			);
			setFiltered(filtered);
		} else if (filterStatus === "Cancelled") {
			const filtered = grievances.filter(
				(grievance) => grievance.status === "Cancelled"
			);
			setFiltered(filtered);
		} else {
			setFiltered(grievances);
		}
	};

	// Update grievance status
	const updateGrievanceStatus = async (grievanceId, status) => {
		setUpdating(true);
		try {
			const response = await fetch(
				`${localhost}/api/warden/setprivategrievance/${grievanceId}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Cookie: cookie,
					},
					body: JSON.stringify({ status }),
				}
			);
			const updatedGrievance = await response.json();

			if (!response.ok) {
				throw new Error(
					updatedGrievance.message ||
						"Failed to update grievance status."
				);
			}
			// Update the local state
			setGrievances((prevGrievances) =>
				prevGrievances.map((grievance) =>
					grievance._id === grievanceId ? updatedGrievance : grievance
				)
			);

			setFiltered((prevGrievances) =>
				prevGrievances.map((grievance) =>
					grievance._id === grievanceId ? updatedGrievance : grievance
				)
			);

			setSelectedGrievance(null);
		} catch (error) {
			console.error("Error updating grievance status:", error);
		} finally {
			setUpdating(false);
		}
	};

	// Call fetchGrievances whenever the filter changes
	useEffect(() => {
		filterChange();
	}, [filterStatus, grievances]);

	useEffect(() => {
		fetchGrievances();
	}, []);

	const onRefresh = () => {
		setRefreshing(true);
		fetchGrievances().then(() => setRefreshing(false));
	};

	const renderGrievance = ({ item }) => (
		<TouchableOpacity
			style={styles.card}
			onPress={() => {
				setSelectedGrievance(item);
				fetchHostlerDetails(item.student); // Fetch hostler details when grievance is selected
			}}
		>
			<Text style={styles.title}>{item.title}</Text>
			<Text style={styles.description}>{item.description}</Text>
			<Text style={styles.date}>
				Date: {new Date(item.date).toLocaleDateString()}
			</Text>
			<Text style={styles.statusText}>
				Status:{" "}
				<Text
					style={{
						color:
							item.status === "Pending"
								? "orange"
								: item.status === "Resolved"
								? "green"
								: "red",
					}}
				>
					{item.status}
				</Text>
			</Text>
		</TouchableOpacity>
	);

	return (
		<View style={styles.container}>
			{/* Filter Section */}
			<View style={styles.filterContainer}>
				{["All", "Pending", "Resolved", "Cancelled"].map((status) => (
					<TouchableOpacity
						key={status}
						style={[
							styles.filterButton,
							filterStatus === status && styles.activeFilter,
						]}
						onPress={() => setFilterStatus(status)}
					>
						<Text
							style={[
								styles.filterText,
								filterStatus === status &&
									styles.activeFilterText,
							]}
						>
							{status}
						</Text>
					</TouchableOpacity>
				))}
			</View>

			{/* Grievances List */}
			{loading ? (
				<View style={styles.loading}>
					<ActivityIndicator size="large" color="#2cb5a0" />
				</View>
			) : (
				<FlatList
					data={filtered}
					keyExtractor={(item) => item._id}
					renderItem={renderGrievance}
					contentContainerStyle={styles.list}
					ListEmptyComponent={
						<Text style={styles.empty}>No private grievances</Text>
					}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
						/>
					}
				/>
			)}

			{selectedGrievance && (
				<Modal transparent={true} animationType="slide">
					<TouchableWithoutFeedback
						onPress={() => {
							setSelectedGrievance(null);
							setSelectedHostler(null);
						}}
					>
						<View style={styles.modalContainer}>
							<TouchableWithoutFeedback>
								<View style={styles.modalContent}>
									<Text style={styles.modalTitle}>
										Grievance Details
									</Text>
									<Text style={styles.modalText}>
										Title: {selectedGrievance.title}
									</Text>
									<Text style={styles.modalText}>
										Description:{" "}
										{selectedGrievance.description}
									</Text>
									<Text style={styles.modalText}>
										Date:{" "}
										{new Date(
											selectedGrievance.date
										).toLocaleDateString()}
									</Text>

									{selectedHostler && (
										<>
											<Text style={styles.modalText}>
												Submitted By:{" "}
												{selectedHostler.name}
											</Text>
											<Text style={styles.modalText}>
												Room No:{" "}
												{selectedHostler.room_no}
											</Text>
											<Text style={styles.modalText}>
												Hostel:{" "}
												{selectedHostler.hostel}
											</Text>
										</>
									)}

									<Text style={styles.modalText}>
										Status: {selectedGrievance.status}
									</Text>

									{updating ? (
										<ActivityIndicator
											size="large"
											color="#2cb5a0"
										/>
									) : (
										<View style={styles.buttonContainer}>
											{selectedGrievance.status ===
												"Pending" && (
												<View
													style={
														styles.buttonContainer
													}
												>
													<TouchableOpacity
														style={
															styles.resolveButton
														}
														onPress={() =>
															updateGrievanceStatus(
																selectedGrievance._id,
																"Resolved"
															)
														}
														disabled={updating}
													>
														<Text
															style={
																styles.buttonText
															}
														>
															Resolve
														</Text>
													</TouchableOpacity>
													<TouchableOpacity
														style={
															styles.cancelButton
														}
														onPress={() =>
															updateGrievanceStatus(
																selectedGrievance._id,
																"Cancelled"
															)
														}
														disabled={updating}
													>
														<Text
															style={
																styles.buttonText
															}
														>
															Cancel
														</Text>
													</TouchableOpacity>
												</View>
											)}
										</View>
									)}
								</View>
							</TouchableWithoutFeedback>
						</View>
					</TouchableWithoutFeedback>
				</Modal>
			)}
		</View>
	);
};

export default PrivateGrievances;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f0f4f7",
		padding: 10,
	},
	list: {
		paddingBottom: 20,
	},
	loading: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	card: {
		backgroundColor: "#ffffff",
		padding: 15,
		borderRadius: 10,
		marginVertical: 10,
		shadowColor: "#000",
		shadowOpacity: 0.15,
		shadowRadius: 5,
		elevation: 3,
		borderLeftWidth: 5,
		borderLeftColor: "#2cb5a0",
	},
	title: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 5,
		color: "#333",
	},
	description: {
		fontSize: 14,
		color: "#555",
		marginBottom: 10,
	},
	date: {
		fontSize: 12,
		color: "#888",
	},
	statusText: {
		fontSize: 14,
		fontWeight: "bold",
	},
	empty: {
		textAlign: "center",
		fontSize: 16,
		color: "#aaa",
		marginTop: 50,
	},
	modalContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0, 0, 0, 0.5)",
	},
	modalContent: {
		backgroundColor: "#ffffff",
		padding: 20,
		borderRadius: 10,
		width: "80%",
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 15,
		textAlign: "center",
		color: "#2cb5a0",
	},
	modalText: {
		fontSize: 16,
		color: "#555",
		marginBottom: 10,
	},
	buttonContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 10,
	},
	resolveButton: {
		backgroundColor: "green",
		padding: 10,
		borderRadius: 5,
		width: "45%",
	},
	cancelButton: {
		backgroundColor: "red",
		padding: 10,
		borderRadius: 5,
		width: "45%",
	},
	buttonText: {
		color: "#fff",
		fontWeight: "bold",
		textAlign: "center",
	},
	filterContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginBottom: 10,
	},
	filterButton: {
		paddingVertical: 8,
		paddingHorizontal: 15,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: "#2cb5a0",
	},
	activeFilter: {
		backgroundColor: "#2cb5a0",
	},
	filterText: {
		color: "#2cb5a0",
		fontWeight: "bold",
	},
	activeFilterText: {
		color: "#fff",
	},
});
