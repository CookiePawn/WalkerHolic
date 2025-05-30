import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StepCounter, GoogleFit } from '@/components';

const Home = () => {
    return (
        <View style={styles.container}>
            <StepCounter />
            {/* <GoogleFit /> */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
    },
});

export default Home;