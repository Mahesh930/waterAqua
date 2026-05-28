import { useState, useCallback } from "react";

export function usePincode() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const lookup = useCallback(async (pincode) => {
    if (pincode.length !== 6) {
      setData(null);
      setError(null);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const json = await res.json();
      if (json[0]?.Status === "Success" && json[0]?.PostOffice?.length > 0) {
        const po = json[0].PostOffice[0];
        const result = {
          pincode,
          area: po.Name,
          city: po.Block || po.Division,
          state: po.State,
          district: po.District,
        };
        setData(result);
        return result;
      } else {
        setError("Invalid pincode");
        setData(null);
        return null;
      }
    } catch {
      setError("Failed to lookup pincode");
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => { setData(null); setError(null); }, []);

  return { lookup, data, loading, error, reset };
}
