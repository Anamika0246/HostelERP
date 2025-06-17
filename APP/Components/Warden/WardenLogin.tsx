import React, { useState } from "react";
import {
	ActivityIndicator,
	Button,
	StyleSheet,
	Text,
	TextInput,
	View,
	TouchableOpacity,
	Modal,
} from "react-native";
import useStore from "../../Store/Store";
import { FontAwesome } from "@expo/vector-icons";
import SuccessAlert from "../Components/SuccessAlert";
import { TouchableWithoutFeedback } from "react-native";

const WardenLogin: React.FC<{ navigation: any }> = ({ navigation }) => {
	const { setCookie, setUser, setData, localhost } = useStore();
	const [userId, setUserId] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [forerror, setForerror] = useState("");
	const [forgetting, setForgetting] = useState(false);
	const [passwordVisible, setPasswordVisible] = useState(false);
	const [forget, setForget] = useState(false);
	const [success, setSuccess] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");

	const ForgetPass = () => {
		if (!userId) return setForerror("Please enter your UserID");

		setForgetting(true);

		fetch(`${localhost}/api/warden/forgetpass`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				user: userId,
			}),
		})
			.then((response) => {
				if (!response.ok) {
					const errorResponse = response.json();
					throw new Error(
						errorResponse.message ||
							"Failed to send password reset email."
					);
				}
				setForget(false);
				setSuccessMessage(
					"Your Temperory Password has been sent to your email."
				);
				setSuccess(true);
			})

			.catch((error) => {
				setForerror(error.message);
			})

			.finally(() => {
				setForgetting(false);
			});
	};


	const Login = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch(
				`${localhost}/api/auth/wardenlogin`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						user: userId,
						password: password,
					}),
				}
			);

			if (!response.ok) {
				const errorResponse = await response.json();
				throw new Error(
					errorResponse.message || "Login failed. Please try again."
				);
			}

			const cookies = response.headers.get("set-cookie");
			if (cookies) setCookie(cookies);
			setUser("Warden");

			const data = await response.json(); // Parse the JSON response
			setData(data);
			navigation.reset({
				index: 0, // Set the index to 0 to make the new screen the first screen in the stack
				routes: [{ name: "Warden Dashboard" }], // Provide the name of the screen you want to navigate to
			}); // Navigate to the Warden Dashboard
		} catch (error) {
			setError(error.message); // Handle errors
		} finally {
			setLoading(false); // Stop loading
		}
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#2cb5a0" />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.formContainer}>
				<Text style={styles.title}>Warden Login</Text>
				<Text style={styles.subtitle}>
					Please enter your UserID and Password
				</Text>

				<TextInput
					placeholder="UserID"
					style={styles.input}
					onChangeText={(e) => setUserId(e)}
					value={userId}
				/>

				<View style={styles.passwordContainer}>
					<TextInput
						placeholder="Password"
						style={styles.input}
						onChangeText={(e) => setPassword(e)}
						value={password}
						secureTextEntry={!passwordVisible}
					/>
					<TouchableOpacity
						style={styles.eyeIcon}
						onPress={() => setPasswordVisible((prev) => !prev)}
					>
						<FontAwesome
							name={passwordVisible ? "eye-slash" : "eye"}
							size={24}
							color="gray"
						/>
					</TouchableOpacity>
				</View>

				<TouchableOpacity
					style={styles.loginButton}
					onPress={Login}
					disabled={loading}
					accessibilityLabel="Login Button"
				>
					<Text style={styles.buttonText}>Login</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.loginButton}
					onPress={() => {
						setForget(true);
					}}
					disabled={loading}
					accessibilityLabel="Login Button"
				>
					<Text style={styles.buttonText}>Forget Password</Text>
				</TouchableOpacity>

				{error && <Text style={styles.errorText}>{error}</Text>}
			</View>
			<Modal
				visible={forget}
				animationType="slide"
				transparent={true}
				onRequestClose={() => setForget(false)}
			>
				<TouchableWithoutFeedback onPress={() => setForget(false)}>
					<View style={styles.modalContainer}>
						<View style={styles.modalContent}>
							<Text style={styles.modalTitle}>
								Forget Password
							</Text>
							<Text style={styles.modalText}>
								Please enter your UserID to receive a password
								reset link.
							</Text>
							<TextInput
								placeholder="UserID"
								style={styles.input}
								onChangeText={(e) => setUserId(e)}
								value={userId}
								accessibilityLabel="Enter your User ID"
							/>
							{forgetting ? (
								<ActivityIndicator
									size="large"
									color="#2cb5a0"
								/>
							) : (
								<TouchableOpacity
									style={styles.loginButton}
									onPress={ForgetPass}
									disabled={loading}
									accessibilityLabel="Reset Password Button"
								>
									<Text style={styles.buttonText}>
										Reset Password
									</Text>
								</TouchableOpacity>
							)}
							{forerror && (
								<Text style={styles.errorText}>{forerror}</Text>
							)}
						</View>
					</View>
				</TouchableWithoutFeedback>
			</Modal>
			<SuccessAlert
				message={successMessage}
				success={success}
				setSuccess={setSuccess}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
		justifyContent: "center",
		alignItems: "center",
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
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	formContainer: {
		width: "80%",
		padding: 20,
		backgroundColor: "#fff",
		borderRadius: 10,
		shadowColor: "#000",
		shadowOpacity: 0.2,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 5,
		elevation: 3,
	},
	title: {
		fontSize: 32,
		fontWeight: "bold",
		color: "#2cb5a0",
		textAlign: "center",
		marginBottom: 10,
	},
	subtitle: {
		fontSize: 18,
		color: "#777",
		textAlign: "center",
		marginBottom: 20,
	},
	input: {
		height: 50,
		borderColor: "#ccc",
		borderWidth: 1,
		marginBottom: 15,
		borderRadius: 5,
		paddingLeft: 10,
		fontSize: 18,
	},
	passwordContainer: {
		position: "relative",
	},
	eyeIcon: {
		position: "absolute",
		right: 10,
		top: "35%",
		transform: [{ translateY: -12 }],
	},
	errorText: {
		color: "red",
		marginTop: 20,
		textAlign: "center",
	},
	loginButton: {
		backgroundColor: "#2cb5a0",
		paddingVertical: 12,
		borderRadius: 5,
		width: "100%",
		alignItems: "center",
		marginBottom: 10,
	},
	buttonText: {
		color: "#fff",
		fontSize: 20,
		fontWeight: "bold",
	},
});

export default WardenLogin;
