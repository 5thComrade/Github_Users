import React, { useState, useEffect, useContext } from "react";
import mockUser from "./mockData/mockUser";
import mockRepos from "./mockData/mockRepos";
import mockFollowers from "./mockData/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

export const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);

  const [requests, setRequests] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: "" });

  const searchGithubUser = async (user) => {
    toggleError();
    try {
      setLoading(true);
      const response = await axios(`${rootUrl}/users/${user}`);
      setGithubUser(response.data);
      const { login, followers_url } = response.data;

      const [repos, followers] = await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ]);
      if (repos.status === "fulfilled") {
        setRepos(repos.value.data);
      }
      if (followers.status === "fulfilled") {
        setFollowers(followers.value.data);
      }
    } catch (e) {
      toggleError(true, "There is no user with that username!");
    }
    checkRequests();
    setLoading(false);
  };

  const checkRequests = async () => {
    try {
      const { data } = await axios(`${rootUrl}/rate_limit`);
      let {
        rate: { remaining },
      } = data;
      setRequests(remaining);
      if (remaining === 0) {
        toggleError(true, "Sorry, you have exceeded your hourly rate limit!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleError = (show = false, msg = "") => {
    setError({
      ...error,
      show,
      msg,
    });
  };

  useEffect(() => {
    checkRequests();
    // eslint-disable-next-line
  }, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        loading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export const useGlobalContext = () => {
  return useContext(GithubContext);
};
