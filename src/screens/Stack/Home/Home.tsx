import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StepCounter } from '@/components';

const Home = () => {
    return (
        <View style={styles.container}>
            {/* <StepCounter /> */}
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