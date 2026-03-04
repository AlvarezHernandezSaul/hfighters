import React from "react";
import styled from "styled-components";
import Header from "../components/Header";
import SatisfactionSurvey from "../components/SatisfactionSurvey";

const PageWrapper = styled.div`
  min-height: 100vh;
  background-color: #f4f4f4;
  padding-top: 70px;
`;

const SurveyPage: React.FC = () => (
  <PageWrapper>
    <Header />
    <SatisfactionSurvey />
  </PageWrapper>
);

export default SurveyPage;
