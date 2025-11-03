"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

export default function PostersManagement() {
	const [user, setUser] = useState<FirebaseUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const auth = getAuth();
		const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
			if (firebaseUser) {
				setUser(firebaseUser);
			} else {
				setUser(null);
				router.push("/admin/login");
			}
			setIsLoading(false);
		});
		return () => unsubscribe();
	}, [router]);

	if (isLoading || !user) {
		return <div>Loading...</div>;
	}

	return (
		<div>
			<h1>Posters Management</h1>
			<p>This page will manage posters.</p>
		</div>
	);
}
