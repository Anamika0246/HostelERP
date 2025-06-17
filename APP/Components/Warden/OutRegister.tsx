import {
	StyleSheet,
	Text,
	View,
	FlatList,
	ActivityIndicator,
	TouchableOpacity,
	TouchableWithoutFeedback,
	Animated,
	Easing,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import useStore from "../../Store/Store";
import { RefreshControl } from "react-native-gesture-handler";

const OutRegister = () => {
	const { localhost, cookie } = useStore();
	const [entries, setEntries] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedStudent, setSelectedStudent] = useState(null);
	const [fetching, setFetching] = useState(false);
	const slideAnim = useRef(new Animated.Value(0)).current;
	const [refreshing, setRefreshing] = useState(false);

	// Fetch out register entries
	const fetchEntries = async () => {
		try {
			// setLoading(true);
			const response = await fetch(
				`${localhost}/api/warden/getentries`,
				{
					headers: { Cookie: cookie },
				}
			);
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.message || "Unable to fetch entries");
			}
			setEntries(data);
		} catch (error) {
			console.error("Error fetching entries:", error);
		} finally {
			setLoading(false);
		}
	};

	// Fetch student details
	const fetchStudentDetails = async (studentId) => {
		setFetching(true);
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
					data.message || "Unable to fetch student details"
				);
			}
			setSelectedStudent(data);
			animatePopup(true);
		} catch (error) {
			console.error("Error fetching student details:", error);
		} finally {
			setFetching(false);
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await fetchEntries();
		setRefreshing(false);
	};

	// Animation for sliding the popup
	const animatePopup = (open) => {
		Animated.timing(slideAnim, {
			toValue: open ? 1 : 0,
			duration: 300,
			easing: Easing.out(Easing.ease),
			useNativeDriver: true,
		}).start(() => {
			if (!open) setSelectedStudent(null);
		});
	};

	// Dismiss the pop-up
	const dismissPopup = () => {
		if (selectedStudent) animatePopup(false);
	};

	useEffect(() => {
		fetchEntries();
	}, []);

	const renderEntry = ({ item }) => (
		<TouchableOpacity
			style={styles.card}
			onPress={() => fetchStudentDetails(item.student)}
		>
			<Text style={styles.purpose}>Purpose: {item.purpose}</Text>
			<Text style={styles.text}>
				Out Time: {new Date(item.out_time).toLocaleString()}
			</Text>
			<Text
				style={[
					styles.text,
					!item.in_time && { color: "red", fontWeight: "bold" },
				]}
			>
				In Time:{" "}
				{item.in_time
					? new Date(item.in_time).toLocaleString()
					: "Not Returned"}
			</Text>
		</TouchableOpacity>
	);

	return (
		<TouchableWithoutFeedback onPress={dismissPopup}>
			<View style={styles.container}>
				{loading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color="#2cb5a0" />
					</View>
				) : (
					<>
						<FlatList
							data={entries}
							keyExtractor={(item) => item._id}
							renderItem={renderEntry}
							contentContainerStyle={styles.list}
							ListEmptyComponent={
								<Text style={styles.empty}>
									No entries found
								</Text>
							}
							refreshControl={
								<RefreshControl
									refreshing={refreshing}
									onRefresh={onRefresh}
								/>
							}
						/>
						{selectedStudent && (
							<Animated.View
								style={[
									styles.detailsContainer,
									{
										transform: [
											{
												translateY:
													slideAnim.interpolate({
														inputRange: [0, 1],
														outputRange: [300, 0],
													}),
											},
										],
									},
								]}
							>
								<Text style={styles.detailsTitle}>
									Student Details
								</Text>
								{fetching ? (
									<View style={styles.loadingContainer}>
										<ActivityIndicator
											size="large"
											color="#2cb5a0"
										/>
									</View>
								) : (
									<View>
										<Text style={styles.detailText}>
											Name: {selectedStudent.name}
										</Text>
										<Text style={styles.detailText}>
											Roll No: {selectedStudent.roll_no}
										</Text>
										<Text style={styles.detailText}>
											Phone: {selectedStudent.phone_no}
										</Text>
										<Text style={styles.detailText}>
											Hostel: {selectedStudent.hostel}
										</Text>
										<Text style={styles.detailText}>
											Room No: {selectedStudent.room_no}
										</Text>
									</View>
								)}
							</Animated.View>
						)}
					</>
				)}
			</View>
		</TouchableWithoutFeedback>
	);
};

export default OutRegister;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f0f4f7",
		padding: 10,
	},
	list: {
		paddingBottom: 20,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	card: {
		backgroundColor: "#ffffff",
		padding: 15,
		borderRadius: 15,
		marginVertical: 10,
		shadowColor: "#000",
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 5,
		borderLeftWidth: 5,
		borderLeftColor: "#2cb5a0",
	},
	purpose: {
		fontWeight: "bold",
		fontSize: 16,
		marginBottom: 5,
		color: "#2cb5a0",
	},
	text: {
		fontSize: 14,
		color: "#333",
	},
	empty: {
		textAlign: "center",
		fontSize: 16,
		color: "#aaa",
		marginTop: 50,
	},
	detailsContainer: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: "#ffffff",
		padding: 20,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		shadowColor: "#000",
		shadowOpacity: 0.3,
		shadowRadius: 10,
		elevation: 10,
	},
	detailsTitle: {
		textAlign: "center",
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 15,
		color: "#2cb5a0",
	},
	detailText: {
		textAlign: "center",
		fontSize: 16,
		color: "#555",
		marginBottom: 5,
	},
});
