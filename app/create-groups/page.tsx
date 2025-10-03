"use client";  

import { useUser } from "@/context/UserContext";
import { useEffect, useState } from "react";

const CreateGroupsPage = () => {
        const { user, isLoading } = useUser();
          const [users, setUsers] = useState<
    { id: string; firstName?: string; email?: string }[]
  >([]);
    const [fetchError, setFetchError] = useState<string | null>(null);

      

    useEffect(() => {
        if (!isLoading && user) {
          fetch(`/api/users`)
            .then((res) => {
              if (!res.ok)
                throw new Error("Erreur lors de la récupération des utilisateurs");
              return res.json();
            })
            .then((data) => {
              setUsers(data);
              setFetchError(null);
            })
            .catch((err) => setFetchError(err.message));
        }
      }, [isLoading, user]);

    return <div className="mt-30">
        {users.map((u) => (
          <div key={u.id}>
            {u.firstName} - {u.email}
          </div>
        ))}
        {fetchError && <div style={{ color: "red" }}>{fetchError}</div>}
    </div>;
};

export default CreateGroupsPage;
